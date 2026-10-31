import React, { useMemo } from 'react';
import * as THREE from 'three';

// Generates a 2048x1024 ultra-crisp authentic Coca-Cola label texture with condensation
export function useCocaColaTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Classic Coca-Cola Vibrant Red Background with subtle vertical brushed metallic gradient
    const grad = ctx.createLinearGradient(0, 0, 2048, 0);
    grad.addColorStop(0, '#be1219');
    grad.addColorStop(0.25, '#e51e2b');
    grad.addColorStop(0.5, '#dc1420');
    grad.addColorStop(0.75, '#ea2330');
    grad.addColorStop(1, '#be1219');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // 2. Chilled condensation water droplet spots across the surface
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 4 + 1.5;
      const dropGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
      dropGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      dropGrad.addColorStop(1, 'rgba(0, 0, 0, 0.25)');
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Iconic Dynamic White Ribbon Wave (The Coca-Cola Contour Wave)
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.beginPath();
    // Repeating dual ribbon across UV seam
    for (let offset of [300, 1300]) {
      ctx.moveTo(offset - 250, 680);
      ctx.bezierCurveTo(offset - 50, 680, offset + 50, 520, offset + 200, 560);
      ctx.bezierCurveTo(offset + 350, 600, offset + 450, 720, offset + 650, 720);
    }
    ctx.stroke();

    // Subtle silver secondary accent wave
    ctx.strokeStyle = 'rgba(240, 240, 240, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let offset of [300, 1300]) {
      ctx.moveTo(offset - 250, 710);
      ctx.bezierCurveTo(offset - 50, 710, offset + 50, 550, offset + 200, 590);
      ctx.bezierCurveTo(offset + 350, 630, offset + 450, 750, offset + 650, 750);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Stylized "Coca-Cola" Spencerian Script Wordmark
    const renderScriptLogo = (x: number, y: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.06); // iconic slight dynamic tilt

      // Shadow for depth
      ctx.fillStyle = 'rgba(120, 10, 15, 0.6)';
      ctx.font = 'italic 900 132px "Space Grotesk", Georgia, "Times New Roman", serif';
      ctx.textAlign = 'center';
      ctx.fillText('Coca-Cola', 4, 4);

      // Main crisp white typography
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Coca-Cola', 0, 0);

      // Trademark registered (R)
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('®', 310, -70);

      // "ORIGINAL TASTE" banner badge
      ctx.font = '800 28px sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillStyle = '#ffffff';
      ctx.fillText('ORIGINAL TASTE', 0, 80);

      // "Delicious & Refreshing" tagline
      ctx.font = 'italic 400 18px Georgia, serif';
      ctx.letterSpacing = '2px';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Delicious & Refreshing • Since 1886', 0, 115);

      ctx.restore();
    };

    // Render on front side (center ~512) and back side (~1536)
    renderScriptLogo(512, 450);
    renderScriptLogo(1536, 450);

    // 5. Authentic Nutritional Facts, Barcode & Recyclable Aluminum Emblem (on sides)
    const renderSideDetails = (x: number) => {
      ctx.save();
      ctx.translate(x, 300);

      // Mini Nutrition Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 180, 260);
      ctx.fillStyle = '#be1219';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Nutrition Facts', 10, 22);
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Serv. size: 1 can (330ml)', 10, 42);
      ctx.fillText('Calories: 139 kcal', 10, 68);
      ctx.fillText('Total Fat: 0g (0%)', 10, 88);
      ctx.fillText('Sodium: 10mg (0%)', 10, 108);
      ctx.fillText('Total Carb: 35g (12%)', 10, 128);
      ctx.fillText('Sugars: 35g', 20, 148);
      ctx.fillText('Protein: 0g', 10, 168);

      // Recyclable Emblem
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(-10, 290, 200, 40);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('100% RECYCLABLE', 12, 315);

      // Realistic Barcode Lines
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 360, 180, 90);
      ctx.fillStyle = '#000000';
      for (let bx = 10; bx < 170; bx += Math.random() * 6 + 3) {
        ctx.fillRect(bx, 370, Math.random() * 3 + 1, 70);
      }

      ctx.restore();
    };

    renderSideDetails(950);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);
}

// Single Hyper-Realistic Coca-Cola Can Component
export const CocaColaCan: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const canTexture = useCocaColaTexture();

  // Silver Brushed Aluminum Material
  const aluminumMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        metalness: 0.95,
        roughness: 0.18,
      }),
    []
  );

  // Candy Metallic Clearcoat Coca-Cola Printed Red Material
  const canBodyMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        map: canTexture,
        roughness: 0.12,
        metalness: 0.72,
        clearcoat: 1.0,
        clearcoatRoughness: 0.08,
        reflectivity: 0.9,
      }),
    [canTexture]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* --- 1. MAIN PRINTED CYLINDRICAL CAN BODY --- */}
      {/* Radius 0.078, Height 0.23 */}
      <mesh position={[0, 0, 0]} material={canBodyMaterial} castShadow receiveShadow>
        <cylinderGeometry args={[0.078, 0.078, 0.23, 48]} />
      </mesh>

      {/* --- 2. BOTTOM TAPER & CONCAVE CHIME (BASE) --- */}
      {/* Inward curve at the bottom */}
      <mesh position={[0, -0.125, 0]} material={aluminumMaterial}>
        <cylinderGeometry args={[0.078, 0.065, 0.022, 48]} />
      </mesh>
      {/* Bottom rim edge */}
      <mesh position={[0, -0.138, 0]} material={aluminumMaterial}>
        <cylinderGeometry args={[0.066, 0.066, 0.006, 48]} />
      </mesh>
      {/* Concave bottom dome center */}
      <mesh position={[0, -0.137, 0]} rotation={[Math.PI, 0, 0]} material={aluminumMaterial}>
        <sphereGeometry args={[0.055, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
      </mesh>

      {/* --- 3. TOP TAPERED NECK & DOUBLE-SEAM RIM --- */}
      {/* Smooth conical taper to the neck */}
      <mesh position={[0, 0.125, 0]} material={aluminumMaterial}>
        <cylinderGeometry args={[0.067, 0.078, 0.022, 48]} />
      </mesh>
      {/* The iconic folded aluminum top rim (Countersink seam) */}
      <mesh position={[0, 0.139, 0]} material={aluminumMaterial}>
        <torusGeometry args={[0.067, 0.004, 16, 48]} />
      </mesh>

      {/* --- 4. TOP LID WITH COUNTERSINK & DRINKING MOUTH --- */}
      <group position={[0, 0.136, 0]}>
        {/* Recessed lid flat surface */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} material={aluminumMaterial}>
          <circleGeometry args={[0.066, 48]} />
        </mesh>

        {/* Embossed drinking mouth score outline */}
        <mesh position={[0, 0.001, 0.028]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.038, 0.026]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} roughness={0.4} />
        </mesh>
      </group>

      {/* --- 5. DETAILED ERGONOMIC PULL-TAB (POP TAB) --- */}
      <group position={[0, 0.138, -0.005]}>
        {/* Central Rivet Pin */}
        <mesh position={[0, 0.002, 0]} material={aluminumMaterial}>
          <cylinderGeometry args={[0.0045, 0.0045, 0.004, 16]} />
        </mesh>

        {/* Tab Body Bar */}
        <mesh position={[0, 0.003, -0.018]} material={aluminumMaterial}>
          <boxGeometry args={[0.022, 0.002, 0.046]} />
        </mesh>

        {/* Finger Ring Hole (Back of Tab) */}
        <mesh position={[0, 0.004, -0.026]} material={aluminumMaterial}>
          <torusGeometry args={[0.009, 0.0025, 12, 24]} />
        </mesh>

        {/* Puncture Blade (Front of Tab pressing on score line) */}
        <mesh position={[0, 0.003, 0.01]} material={aluminumMaterial}>
          <boxGeometry args={[0.016, 0.002, 0.016]} />
        </mesh>
      </group>

      {/* --- 6. REALISTIC GLISTENING WATER DROPLETS (COLD CAN EFFECT) --- */}
      <CondensationDroplets />
    </group>
  );
};

// Generates 3D glistening micro-droplets on the can surface
const CondensationDroplets: React.FC = () => {
  const dropletGeo = useMemo(() => new THREE.SphereGeometry(0.0035, 8, 8), []);
  const dropletMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: '#ffffff',
        transmission: 0.95,
        opacity: 0.85,
        transparent: true,
        roughness: 0.05,
        ior: 1.333, // Real water index of refraction
      }),
    []
  );

  // Position 24 droplets strategically around the curved surface
  const dropletPositions = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i < 28; i++) {
      const angle = (i / 28) * Math.PI * 2 + (i % 3) * 0.4;
      const radius = 0.0785;
      const y = ((i % 7) / 7) * 0.2 - 0.1;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push([x, y, z]);
    }
    return list;
  }, []);

  return (
    <group>
      {dropletPositions.map((pos, idx) => (
        <mesh key={`drop-${idx}`} position={pos} geometry={dropletGeo} material={dropletMat} />
      ))}
    </group>
  );
};

// High-End 6-Pack Coca-Cola Cluster for the Retail Shelf
export const CocaColaSixPack: React.FC = () => {
  return (
    <group>
      {/* 2 rows of 3 cans */}
      {[-0.17, 0, 0.17].map((z, zi) =>
        [-0.09, 0.09].map((x, xi) => (
          <CocaColaCan
            key={`coca-${zi}-${xi}`}
            position={[x, 0, z]}
            // Subtle slight natural rotation for realism
            rotation={[0, (zi * 3 + xi) * 1.1, 0]}
            scale={1.05}
          />
        ))
      )}

      {/* Clear Modern Acrylic Shelf Tray Underneath */}
      <mesh position={[0, -0.145, 0]}>
        <boxGeometry args={[0.22, 0.008, 0.4]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transmission={0.9}
          roughness={0.1}
          transparent
          opacity={0.3}
        />
      </mesh>
    </group>
  );
};
