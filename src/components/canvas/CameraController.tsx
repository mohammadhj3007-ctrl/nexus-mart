import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Bounding box obstacles for supermarket fixtures
const OBSTACLES = [
  // Shelf 1 (Beverages)
  { minX: -8.8, maxX: -7.2, minZ: -8.5, maxZ: 4.5 },
  // Shelf 2 (Groceries)
  { minX: -3.8, maxX: -2.2, minZ: -8.5, maxZ: 4.5 },
  // Shelf 3 (Electronics)
  { minX: 2.2, maxX: 3.8, minZ: -8.5, maxZ: 4.5 },
  // Shelf 4 (Personal Care)
  { minX: 7.2, maxX: 8.8, minZ: -8.5, maxZ: 4.5 },
  // Checkout Counter Block
  { minX: 6.5, maxX: 11.5, minZ: 8.0, maxZ: 12.5 },
];

const STORE_BOUNDS = {
  minX: -12.2,
  maxX: 12.2,
  minZ: -13.5,
  maxZ: 15.2,
};

const PLAYER_RADIUS = 0.55;
const EYE_HEIGHT = 1.7;

export const CameraController: React.FC = () => {
  const { camera } = useThree();
  const hasEntered = useStore((s) => s.hasEntered);
  const cameraTarget = useStore((s) => s.cameraTarget);
  const clearTeleportTarget = useStore((s) => s.clearTeleportTarget);
  const setPlayerPos = useStore((s) => s.setPlayerPos);

  // Position & rotation state
  const playerPos = useRef(new THREE.Vector3(0, EYE_HEIGHT, 11));
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0); // Horizontal rotation in radians (0 = looking down -Z)
  const pitch = useRef(0); // Vertical rotation in radians

  // Normalized mouse coordinates: -1 to 1
  const mouseNorm = useRef({ x: 0, y: 0 });

  // Key tracking
  const keys = useRef<{ [key: string]: boolean }>({});
  const bobTimer = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture keys if an input is focused
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }
      keys.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const handleMouseMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseNorm.current.x = nx;
      mouseNorm.current.y = ny;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Collision resolution helper
  const checkCollision = (x: number, z: number): boolean => {
    // Check perimeter walls
    if (
      x < STORE_BOUNDS.minX ||
      x > STORE_BOUNDS.maxX ||
      z < STORE_BOUNDS.minZ ||
      z > STORE_BOUNDS.maxZ
    ) {
      return true;
    }

    // Check shelf obstacles
    for (const obs of OBSTACLES) {
      if (
        x >= obs.minX - PLAYER_RADIUS &&
        x <= obs.maxX + PLAYER_RADIUS &&
        z >= obs.minZ - PLAYER_RADIUS &&
        z <= obs.maxZ + PLAYER_RADIUS
      ) {
        return true;
      }
    }
    return false;
  };

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);

    // --- TELEPORT / GLIDE ANIMATION MODE ---
    if (cameraTarget) {
      const targetVec = new THREE.Vector3(...cameraTarget.position);
      const lookAtVec = new THREE.Vector3(...cameraTarget.lookAt);

      // Smoothly glide position
      playerPos.current.lerp(targetVec, 0.08);

      // Compute target yaw and pitch to face lookAt
      const diff = new THREE.Vector3().subVectors(lookAtVec, playerPos.current);
      const targetYaw = Math.atan2(-diff.x, -diff.z);
      const horizontalDist = Math.sqrt(diff.x * diff.x + diff.z * diff.z);
      const targetPitch = Math.atan2(diff.y, horizontalDist);

      // Normalize shortest angle difference for yaw
      let yawDiff = (targetYaw - yaw.current) % (Math.PI * 2);
      if (yawDiff < -Math.PI) yawDiff += Math.PI * 2;
      if (yawDiff > Math.PI) yawDiff -= Math.PI * 2;
      yaw.current += yawDiff * 0.08;

      pitch.current = THREE.MathUtils.lerp(pitch.current, targetPitch, 0.08);

      camera.position.copy(playerPos.current);
      camera.rotation.set(0, 0, 0);
      camera.rotateY(yaw.current);
      camera.rotateX(pitch.current);

      setPlayerPos([playerPos.current.x, playerPos.current.y, playerPos.current.z]);

      // Check arrival threshold
      if (
        playerPos.current.distanceTo(targetVec) < 0.08 &&
        Math.abs(yawDiff) < 0.05
      ) {
        clearTeleportTarget();
      }
      return;
    }

    // Idle camera looking down central supermarket aisle
    if (!hasEntered) {
      camera.position.set(0, EYE_HEIGHT, 11.5);
      camera.lookAt(0, EYE_HEIGHT, 0);
      return;
    }

    // --- HEAD ROTATION (EDGE PANNING & PITCH) ---
    // Central 65% deadzone: deadzone threshold = 0.65
    const DEADZONE = 0.65;
    const nx = mouseNorm.current.x;
    const ny = mouseNorm.current.y;

    // Edge panning Yaw (turn left/right)
    if (Math.abs(nx) > DEADZONE) {
      const excess = (Math.abs(nx) - DEADZONE) / (1 - DEADZONE);
      const direction = -Math.sign(nx); // Move right mouse -> turn right
      const yawSpeed = 1.8;
      yaw.current += direction * excess * yawSpeed * dt;
    }

    // Edge panning Pitch (tilt up/down)
    if (Math.abs(ny) > DEADZONE) {
      const excess = (Math.abs(ny) - DEADZONE) / (1 - DEADZONE);
      const direction = -Math.sign(ny); // Move up mouse -> look up
      const pitchSpeed = 1.3;
      pitch.current += direction * excess * pitchSpeed * dt;
      // Clamp pitch to avoid neck break (-45° to +40°)
      pitch.current = THREE.MathUtils.clamp(
        pitch.current,
        -Math.PI * 0.25,
        Math.PI * 0.22
      );
    }

    // --- WASD WALKING MOVEMENT ---
    const moveVector = new THREE.Vector3();
    const isSprint = keys.current['ShiftLeft'] || keys.current['ShiftRight'];
    const walkSpeed = isSprint ? 6.5 : 4.2;

    if (keys.current['KeyW'] || keys.current['ArrowUp']) moveVector.z -= 1;
    if (keys.current['KeyS'] || keys.current['ArrowDown']) moveVector.z += 1;
    if (keys.current['KeyA'] || keys.current['ArrowLeft']) moveVector.x -= 1;
    if (keys.current['KeyD'] || keys.current['ArrowRight']) moveVector.x += 1;

    if (moveVector.lengthSq() > 0) {
      moveVector.normalize();
      // Rotate moveVector according to current camera yaw
      moveVector.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current);
      moveVector.multiplyScalar(walkSpeed);
    }

    // Velocity damping (smooth acceleration & deceleration)
    velocity.current.lerp(moveVector, 12 * dt);

    // Calculate candidate new position with slide collision check
    const currentX = playerPos.current.x;
    const currentZ = playerPos.current.z;
    const candidateX = currentX + velocity.current.x * dt;
    const candidateZ = currentZ + velocity.current.z * dt;

    // Slide on X axis
    if (!checkCollision(candidateX, currentZ)) {
      playerPos.current.x = candidateX;
    } else {
      velocity.current.x = 0;
    }

    // Slide on Z axis
    if (!checkCollision(playerPos.current.x, candidateZ)) {
      playerPos.current.z = candidateZ;
    } else {
      velocity.current.z = 0;
    }

    // Head bobbing calculation
    const horizontalSpeed = Math.sqrt(
      velocity.current.x * velocity.current.x +
        velocity.current.z * velocity.current.z
    );

    let bobOffset = 0;
    if (horizontalSpeed > 0.4) {
      bobTimer.current += dt * (isSprint ? 15 : 10);
      bobOffset = Math.sin(bobTimer.current) * (isSprint ? 0.045 : 0.025);
    } else {
      bobTimer.current = THREE.MathUtils.lerp(bobTimer.current, 0, 5 * dt);
    }

    // Apply to Three.js camera
    camera.position.x = playerPos.current.x;
    camera.position.y = EYE_HEIGHT + bobOffset;
    camera.position.z = playerPos.current.z;

    // Apply orientation: first yaw (Y-axis), then pitch (local X-axis)
    camera.rotation.set(0, 0, 0);
    camera.rotateY(yaw.current);
    camera.rotateX(pitch.current);

    // Sync player position with store
    setPlayerPos([playerPos.current.x, playerPos.current.y, playerPos.current.z]);
  });

  return null;
};
