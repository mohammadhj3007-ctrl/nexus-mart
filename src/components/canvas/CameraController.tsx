import React, { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/useStore';

// Bounding box obstacles for expanded supermarket fixtures
const OBSTACLES = [
  // Gondola Aisle 1 (Beverages / Snacks)
  { minX: -8.3, maxX: -6.7, minZ: -12.2, maxZ: 10.2 },
  // Gondola Aisle 2 (Pantry & Cereal)
  { minX: -3.3, maxX: -1.7, minZ: -12.2, maxZ: 10.2 },
  // Gondola Aisle 3 (Health & Personal Care)
  { minX: 1.7, maxX: 3.3, minZ: -12.2, maxZ: 10.2 },
  // Gondola Aisle 4 (Tech & Electronics)
  { minX: 6.7, maxX: 8.3, minZ: -12.2, maxZ: 10.2 },
  // Farm Fresh Produce Islands (Right Department)
  { minX: 13.2, maxX: 16.8, minZ: -12.5, maxZ: 11.0 },
  // Butcher Shop Chilled Cases (Left Department)
  { minX: -19.0, maxX: -17.0, minZ: -17.0, maxZ: 10.0 },
  // Cold Dairy & Beverage Refrigerator Wall (Back Wall)
  { minX: -17.0, maxX: 17.0, minZ: -25.8, maxZ: -24.0 },
  // Conveyor Checkout Lanes (Front Left)
  { minX: -8.3, maxX: -1.7, minZ: 14.0, maxZ: 18.2 },
  // Self-Checkout Pod Bank (Front Right)
  { minX: 3.0, maxX: 8.0, minZ: 13.5, maxZ: 18.5 },
];

const STORE_BOUNDS = {
  minX: -20.5,
  maxX: 20.5,
  minZ: -24.5,
  maxZ: 24.5,
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
  const playerPos = useRef(new THREE.Vector3(0, EYE_HEIGHT, 19.0));
  const velocity = useRef(new THREE.Vector3());
  const yaw = useRef(0); // Horizontal rotation in radians (0 = looking down -Z)
  const pitch = useRef(0); // Vertical rotation in radians


  // Key tracking
  const keys = useRef<{ [key: string]: boolean }>({});
  const bobTimer = useRef(0);
  const isLocked = useRef(false);

  useEffect(() => {
    const handlePointerLockChange = () => {
      isLocked.current = document.pointerLockElement !== null;
    };

    const handleClick = (e: MouseEvent) => {
      // If clicking interactive UI elements, don't request lock
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('a') ||
        target.closest('.glass-panel') ||
        target.closest('[role="dialog"]')
      ) {
        return;
      }

      if (!isLocked.current && hasEntered) {
        document.body.requestPointerLock();
      }
    };

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
      if (isLocked.current) {
        // Direct FPS Shooter Mouse Look
        const sensitivity = 0.0022;
        yaw.current -= e.movementX * sensitivity;
        pitch.current -= e.movementY * sensitivity;

        // Clamp pitch to avoid neck break (-80° to +80°)
        const maxPitch = Math.PI * 0.44;
        pitch.current = THREE.MathUtils.clamp(pitch.current, -maxPitch, maxPitch);
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('click', handleClick);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [hasEntered]);

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
