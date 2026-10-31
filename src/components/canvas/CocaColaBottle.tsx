import React, { useMemo } from 'react';
import * as THREE from 'three';

// 2048x1024 high-res wrap-around label texture for the 1.5L Coca-Cola Bottle
export function useCocaColaBottleTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Signature Coca-Cola Deep Red Banner Background
    const grad = ctx.createLinearGradient(0, 0, 2048, 0);
    grad.addColorStop(0, '#bd131a');
    grad.addColorStop(0.3, '#e31b23');
    grad.addColorStop(0.5, '#da121b');
    grad.addColorStop(0.7, '#ea2229');
    grad.addColorStop(1, '#bd131a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // 2. Micro water droplet condensation on label
    for (let i = 0; i < 700; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 3.5 + 1.2;
      const dropGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
      dropGrad.addColorStop(0.8, 'rgba(255, 255, 255, 0.1)');
      dropGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Iconic White Dynamic Contour Ribbon Wave
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 16;
    ctx.beginPath();
    for (let offset of [300, 1300]) {
      ctx.moveTo(offset - 250, 680);
      ctx.bezierCurveTo(offset - 60, 680, offset + 40, 500, offset + 200, 540);
      ctx.bezierCurveTo(offset + 350, 580, offset + 460, 720, offset + 650, 720);
    }
    ctx.stroke();

    // Secondary silver accent line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    for (let offset of [300, 1300]) {
      ctx.moveTo(offset - 250, 715);
      ctx.bezierCurveTo(offset - 60, 715, offset + 40, 535, offset + 200, 575);
      ctx.bezierCurveTo(offset + 350, 615, offset + 460, 755, offset + 650, 755);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Spencerian Script Logo & Prominent "1.5 L" Badge
    const renderLogoAndBadges = (x: number) => {
      ctx.save();
      ctx.translate(x, 460);
      ctx.rotate(-0.06);

      // Coca-Cola Shadow
      ctx.fillStyle = 'rgba(100, 5, 10, 0.6)';
      ctx.font = 'italic 900 138px "Space Grotesk", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Coca-Cola', 4, 4);

      // Crisp White Logo
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Coca-Cola', 0, 0);

      // (R) Registered Mark
      ctx.font = 'bold 22px sans-serif';
      ctx.fillText('®', 320, -75);

      // ORIGINAL TASTE
      ctx.font = '800 28px sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('ORIGINAL TASTE', 0, 80);

      // 1.5 LITERS BADGE (Yellow/Gold Accent)
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(-90, 105, 180, 42);
      ctx.fillStyle = '#000000';
      ctx.font = '900 24px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('1.5 LITERS', 0, 134);

      ctx.restore();
    };

    renderLogoAndBadges(512);
    renderLogoAndBadges(1536);

    // 5. Nutrition, Barcode & Recycled Plastic Seal
    const renderSideDetails = (x: number) => {
      ctx.save();
      ctx.translate(x, 260);

      // Nutrition Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 190, 290);
      ctx.fillStyle = '#be1219';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('Nutrition Facts', 10, 24);
      ctx.fillStyle = '#1e293b';
      ctx.font = '11px sans-serif';
      ctx.fillText('Serving: 250ml (~6 servings)', 10, 46);
      ctx.fillText('Calories: 105 kcal per serv.', 10, 74);
      ctx.fillText('Total Fat: 0g (0%)', 10, 96);
      ctx.fillText('Sodium: 10mg (0%)', 10, 118);
      ctx.fillText('Total Carb: 27g (9%)', 10, 140);
      ctx.fillText('Sugars: 27g', 20, 162);
      ctx.fillText('100% Recycled Bottle (rPET)', 10, 210);

      // Barcode
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 370, 190, 90);
      ctx.fillStyle = '#000000';
      for (let bx = 10; bx < 180; bx += Math.random() * 5 + 3) {
        ctx.fillRect(bx, 380, Math.random() * 3 + 1, 70);
      }

      ctx.restore();
    };

    renderSideDetails(950);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 8;
    tex.needsUpdate = true;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    return tex;
  }, []);
}

// Single Hyper-Realistic 1.5-Liter Coca-Cola Bottle
export const CocaColaBottle: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const labelTexture = useCocaColaBottleTexture();

  // Clear Glossy PET Plastic Outer Material (Ultra-reliable standard PBR)
  const clearPETMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#f0f9ff',
        transparent: true,
        opacity: 0.45,
        roughness: 0.1,
        metalness: 0.2,
      }),
    []
  );

  // Deep Fizzy Caramel Coca-Cola Liquid with rich inner ruby glow
  const liquidMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#2b0704',
        emissive: '#450a0a',
        emissiveIntensity: 0.35,
        roughness: 0.2,
        metalness: 0.1,
      }),
    []
  );

  // Red Plastic Screw Cap Material
  const capMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#dc2626',
        roughness: 0.35,
        metalness: 0.1,
      }),
    []
  );

  // Label Material (Laminated Gloss Plastic)
  const labelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: labelTexture,
        color: '#dc2626',
        roughness: 0.25,
        metalness: 0.1,
        side: THREE.DoubleSide,
      }),
    [labelTexture]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* --- 1. DARK CARAMEL COCA-COLA LIQUID CORE --- */}
      {/* Lower liquid body */}
      <mesh position={[0, 0.085, 0]} material={liquidMaterial}>
        <cylinderGeometry args={[0.049, 0.05, 0.18, 36]} />
      </mesh>
      {/* Tapered liquid shoulder */}
      <mesh position={[0, 0.21, 0]} material={liquidMaterial}>
        <cylinderGeometry args={[0.016, 0.049, 0.07, 36]} />
      </mesh>
      {/* Liquid in neck */}
      <mesh position={[0, 0.26, 0]} material={liquidMaterial}>
        <cylinderGeometry args={[0.014, 0.016, 0.03, 24]} />
      </mesh>

      {/* --- 2. PETALOID 5-FEET BASE (REALISTIC 1.5L SODA BASE) --- */}
      <group position={[0, 0.01, 0]}>
        {/* Central bottom dome */}
        <mesh position={[0, 0.01, 0]} material={clearPETMaterial}>
          <cylinderGeometry args={[0.048, 0.042, 0.02, 32]} />
        </mesh>
        {/* 5 Molded Petaloid Support Feet */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2;
          const x = Math.cos(angle) * 0.038;
          const z = Math.sin(angle) * 0.038;
          return (
            <mesh key={`foot-${i}`} position={[x, 0, z]} material={clearPETMaterial}>
              <sphereGeometry args={[0.014, 16, 16]} />
            </mesh>
          );
        })}
      </group>

      {/* --- 3. LOWER CLEAR CONTOUR BODY --- */}
      <mesh position={[0, 0.065, 0]} material={clearPETMaterial}>
        <cylinderGeometry args={[0.053, 0.052, 0.09, 48]} />
      </mesh>

      {/* --- 4. WAIST WRAP-AROUND RED LABEL --- */}
      <mesh position={[0, 0.145, 0]} material={labelMaterial} castShadow>
        <cylinderGeometry args={[0.054, 0.054, 0.095, 48]} />
      </mesh>

      {/* --- 5. UPPER CONTOUR SHOULDER & TAPERING NECK --- */}
      {/* Sloping shoulder */}
      <mesh position={[0, 0.22, 0]} material={clearPETMaterial}>
        <cylinderGeometry args={[0.02, 0.053, 0.075, 48]} />
      </mesh>

      {/* Slender bottle neck with molded grip rings */}
      <mesh position={[0, 0.27, 0]} material={clearPETMaterial}>
        <cylinderGeometry args={[0.016, 0.018, 0.04, 32]} />
      </mesh>
      {/* Molded neck ring (support flange) */}
      <mesh position={[0, 0.275, 0]} material={clearPETMaterial}>
        <torusGeometry args={[0.018, 0.002, 12, 32]} />
      </mesh>

      {/* --- 6. RED PLASTIC THREADED SCREW CAP --- */}
      <group position={[0, 0.302, 0]}>
        {/* Tamper-evident collar ring */}
        <mesh position={[0, -0.01, 0]} material={capMaterial}>
          <cylinderGeometry args={[0.0175, 0.0175, 0.005, 32]} />
        </mesh>
        {/* Main ribbed screw cap */}
        <mesh position={[0, 0.005, 0]} material={capMaterial}>
          <cylinderGeometry args={[0.017, 0.017, 0.018, 32]} />
        </mesh>
        {/* Cap top chamfer */}
        <mesh position={[0, 0.014, 0]} material={capMaterial}>
          <cylinderGeometry args={[0.015, 0.017, 0.003, 32]} />
        </mesh>
      </group>

      {/* --- 7. CHILLED CONDENSATION DROPLETS --- */}
      <BottleCondensationDroplets />
    </group>
  );
};

// Generates 3D glistening micro-droplets on the bottle surface
const BottleCondensationDroplets: React.FC = () => {
  const dropletGeo = useMemo(() => new THREE.SphereGeometry(0.0032, 8, 8), []);
  const dropletMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#ffffff',
        transparent: true,
        opacity: 0.8,
        roughness: 0.1,
      }),
    []
  );

  const droplets = useMemo(() => {
    const list: [number, number, number][] = [];
    for (let i = 0; i < 32; i++) {
      const angle = (i / 32) * Math.PI * 2 + (i % 3) * 0.5;
      const radius = 0.055;
      const y = ((i % 8) / 8) * 0.22 + 0.04;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      list.push([x, y, z]);
    }
    return list;
  }, []);

  return (
    <group>
      {droplets.map((pos, idx) => (
        <mesh key={`bdrop-${idx}`} position={pos} geometry={dropletGeo} material={dropletMat} />
      ))}
    </group>
  );
};

// Retail Shelf Cluster: 4 × 1.5L Coca-Cola Bottles in an organized display
export const CocaColaBottleCluster: React.FC = () => {
  return (
    <group>
      {/* 2x2 grid of 1.5L bottles */}
      {[-0.07, 0.07].map((z, zi) =>
        [-0.07, 0.07].map((x, xi) => (
          <CocaColaBottle
            key={`coca-bot-${zi}-${xi}`}
            position={[x, 0, z]}
            rotation={[0, (zi * 2 + xi) * 1.5, 0]}
            scale={0.92}
          />
        ))
      )}

      {/* Clean clear acrylic retail tray keeping bottles sturdy on shelf */}
      <mesh position={[0, 0.002, 0]}>
        <boxGeometry args={[0.26, 0.006, 0.26]} />
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
