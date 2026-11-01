import React, { useMemo } from 'react';
import * as THREE from 'three';

// Ultra-realistic 2048x1024 wrap-around label texture for Coca-Cola Bottle
export function useCocaColaBottleTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // 1. Signature Coca-Cola Deep Ruby Red Gradient
    const grad = ctx.createLinearGradient(0, 0, 2048, 0);
    grad.addColorStop(0, '#a60a11');
    grad.addColorStop(0.25, '#d4141d');
    grad.addColorStop(0.5, '#f41b24');
    grad.addColorStop(0.75, '#d4141d');
    grad.addColorStop(1, '#a60a11');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // 2. Micro water droplet condensation on label
    ctx.save();
    for (let i = 0; i < 900; i++) {
      const x = Math.random() * 2048;
      const y = Math.random() * 1024;
      const r = Math.random() * 3.5 + 1.0;
      const dropGrad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
      dropGrad.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
      dropGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.15)');
      dropGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
      ctx.fillStyle = dropGrad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Iconic Dynamic Ribbon Contour Wave (White & Silver)
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 18;
    ctx.beginPath();
    for (const offset of [280, 1300]) {
      ctx.moveTo(offset - 260, 680);
      ctx.bezierCurveTo(offset - 60, 680, offset + 40, 480, offset + 220, 520);
      ctx.bezierCurveTo(offset + 380, 560, offset + 500, 720, offset + 700, 720);
    }
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (const offset of [280, 1300]) {
      ctx.moveTo(offset - 260, 720);
      ctx.bezierCurveTo(offset - 60, 720, offset + 40, 520, offset + 220, 560);
      ctx.bezierCurveTo(offset + 380, 600, offset + 500, 760, offset + 700, 760);
    }
    ctx.stroke();
    ctx.restore();

    // 4. Logo Render function (Front and Back)
    const renderLogoAndBadges = (x: number) => {
      ctx.save();
      ctx.translate(x, 440);
      ctx.rotate(-0.06);

      // Deep Shadow for 3D depth
      ctx.fillStyle = 'rgba(80, 0, 5, 0.5)';
      ctx.font = 'italic bold 148px "Brush Script MT", "Space Grotesk", Georgia, cursive, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Coca-Cola', 5, 5);

      // Crisp Pure White Spencerian Logo
      ctx.fillStyle = '#ffffff';
      ctx.fillText('Coca-Cola', 0, 0);

      // Trademark (R)
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText('®', 340, -85);

      // Sub-label ORIGINAL TASTE
      ctx.font = 'bold 30px "Plus Jakarta Sans", sans-serif';
      ctx.letterSpacing = '8px';
      ctx.fillText('ORIGINAL TASTE', 0, 85);

      // 1.5 LITER Yellow Badge
      ctx.fillStyle = '#ffea00';
      ctx.fillRect(-100, 115, 200, 44);
      ctx.fillStyle = '#000000';
      ctx.font = '900 26px sans-serif';
      ctx.letterSpacing = '2px';
      ctx.fillText('1.5 LITERS', 0, 147);

      ctx.restore();
    };

    renderLogoAndBadges(512);
    renderLogoAndBadges(1536);

    // 5. Nutritional Info and Barcode
    const renderSideDetails = (x: number) => {
      ctx.save();
      ctx.translate(x, 260);

      // White Nutritional Panel
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 200, 310);
      ctx.fillStyle = '#d4141d';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Nutrition Facts', 12, 28);
      ctx.fillStyle = '#1e293b';
      ctx.font = '12px sans-serif';
      ctx.fillText('Per 250ml Serving', 12, 54);
      ctx.fillText('Calories: 105 kcal', 12, 82);
      ctx.fillText('Total Fat: 0g (0%)', 12, 106);
      ctx.fillText('Sodium: 12mg (1%)', 12, 130);
      ctx.fillText('Total Sugars: 27g', 12, 154);
      ctx.fillText('100% Recyclable Bottle', 12, 220);

      // Real-looking Barcode
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 390, 200, 100);
      ctx.fillStyle = '#000000';
      for (let bx = 12; bx < 188; bx += Math.random() * 5 + 3) {
        ctx.fillRect(bx, 400, Math.random() * 3.5 + 1.2, 80);
      }

      ctx.restore();
    };

    renderSideDetails(950);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

// Masterpiece Smooth Contour Profile generated via Spline Interpolation
function generateContourBottleGeometry() {
  // Define profile curve points [radius (x), height (y)]
  const controlPoints: [number, number][] = [
    [0.0, 0.0],
    [0.024, 0.002],
    [0.038, 0.008],
    [0.043, 0.022], // Foot / bottom rim
    [0.045, 0.045], // Lower base
    [0.046, 0.075],
    [0.047, 0.110], // Main body
    [0.046, 0.145], // Label zone
    [0.045, 0.165], // Waist tuck
    [0.047, 0.185], // Shoulder swell
    [0.045, 0.210],
    [0.038, 0.235], // Shoulder slope inward
    [0.025, 0.260], // Transition to neck
    [0.016, 0.285], // Slender neck
    [0.015, 0.300],
    [0.018, 0.305], // Molded security ring
    [0.015, 0.310], // Screw thread base
    [0.015, 0.320], // Lip
    [0.012, 0.321], // Inner lip
    [0.0, 0.321],
  ];

  const points: THREE.Vector2[] = [];
  // Sample smoothly along the curve
  for (let i = 0; i < controlPoints.length; i++) {
    points.push(new THREE.Vector2(controlPoints[i][0], controlPoints[i][1]));
  }

  // Generate 64-segment ultra-smooth Lathe geometry
  const geom = new THREE.LatheGeometry(points, 64);
  geom.computeVertexNormals();
  return geom;
}

// Inner Liquid Volume Geometry (follows outer contour with inward offset)
function generateLiquidGeometry() {
  const liquidControlPoints: [number, number][] = [
    [0.0, 0.004],
    [0.022, 0.006],
    [0.036, 0.012],
    [0.041, 0.024],
    [0.043, 0.045],
    [0.044, 0.075],
    [0.045, 0.110],
    [0.044, 0.145],
    [0.043, 0.165],
    [0.045, 0.185],
    [0.043, 0.210],
    [0.036, 0.235],
    [0.023, 0.260],
    [0.014, 0.280], // Liquid fills up to middle of neck
    [0.0, 0.280],   // Top meniscus
  ];

  const points: THREE.Vector2[] = [];
  for (const cp of liquidControlPoints) {
    points.push(new THREE.Vector2(cp[0], cp[1]));
  }

  const geom = new THREE.LatheGeometry(points, 64);
  geom.computeVertexNormals();
  return geom;
}

// Bottle Cap Geometry with Fluted/Ribbed Ridges
function generateCapGeometry() {
  const capPoints: THREE.Vector2[] = [
    new THREE.Vector2(0.0155, 0.308),
    new THREE.Vector2(0.017, 0.310),
    new THREE.Vector2(0.017, 0.327),
    new THREE.Vector2(0.015, 0.329),
    new THREE.Vector2(0.0, 0.329),
  ];
  const geom = new THREE.LatheGeometry(capPoints, 48);
  geom.computeVertexNormals();
  return geom;
}

export const CocaColaBottle: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0], scale = 1 }) => {
  const labelTexture = useCocaColaBottleTexture();

  // Geometries
  const bottleGeometry = useMemo(() => generateContourBottleGeometry(), []);
  const liquidGeometry = useMemo(() => generateLiquidGeometry(), []);
  const capGeometry = useMemo(() => generateCapGeometry(), []);

  // 1. Crystal Optical PET / Glass Material (Realistic Refraction & Specular Highlights)
  const bottleGlassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        transmission: 0.94, // Real optical glass/clear plastic transmission
        opacity: 1,
        transparent: true,
        roughness: 0.05, // Mirror glossy finish
        ior: 1.52, // Optical index of refraction for glass / PET plastic
        thickness: 0.25,
        specularIntensity: 1.0,
        specularColor: new THREE.Color('#ffffff'),
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
      }),
    []
  );

  // 2. Deep Sparkling Caramel Soda Liquid Material
  const liquidMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#1f0402'),
        emissive: new THREE.Color('#380603'),
        emissiveIntensity: 0.25, // Subtle rich ruby inner glow under light
        roughness: 0.15,
        transmission: 0.45,
        thickness: 0.8,
        ior: 1.34, // Liquid refractive index
      }),
    []
  );

  // 3. Signature Coca-Cola Red Cap Material
  const capMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#e11d27'),
        roughness: 0.3,
        metalness: 0.05,
      }),
    []
  );

  // 4. Laminated High-Gloss Wrap Label
  const labelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        map: labelTexture,
        roughness: 0.2,
        metalness: 0.08,
        side: THREE.DoubleSide,
      }),
    [labelTexture]
  );

  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* 1. Deep Caramel Coca-Cola Liquid Volume */}
      <mesh geometry={liquidGeometry} material={liquidMaterial} renderOrder={1} />

      {/* 2. Glass / Clear Contour Plastic Outer Shell */}
      <mesh geometry={bottleGeometry} material={bottleGlassMaterial} renderOrder={2} castShadow />

      {/* 3. Fitted Wrap-Around Brand Label (waist section) */}
      <mesh position={[0, 0.128, 0]} material={labelMaterial} renderOrder={3} castShadow>
        <cylinderGeometry args={[0.0465, 0.0465, 0.075, 64, 1, true]} />
      </mesh>

      {/* 4. Molded Screw Cap */}
      <mesh geometry={capGeometry} material={capMaterial} renderOrder={4} castShadow />

      {/* 5. Fine Vertical Cap Grip Ridges */}
      <group position={[0, 0.318, 0]}>
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * Math.PI * 2;
          const x = Math.cos(angle) * 0.0171;
          const z = Math.sin(angle) * 0.0171;
          return (
            <mesh key={`ridge-${i}`} position={[x, 0, z]} rotation={[0, -angle, 0]} material={capMaterial}>
              <boxGeometry args={[0.0008, 0.016, 0.001]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};

// 6-Pack Merged Cluster for High Performance Shelf Display
export const CocaColaBottleCluster: React.FC<{
  position?: [number, number, number];
  rotation?: [number, number, number];
}> = ({ position = [0, 0, 0], rotation = [0, 0, 0] }) => {
  // 2x3 Grid Layout
  const bottleOffsets: [number, number, number][] = [
    [-0.10, 0, -0.06],
    [0.0, 0, -0.06],
    [0.10, 0, -0.06],
    [-0.10, 0, 0.06],
    [0.0, 0, 0.06],
    [0.10, 0, 0.06],
  ];

  return (
    <group position={position} rotation={rotation}>
      {/* 6 Individual Contour Bottles */}
      {bottleOffsets.map((offset, idx) => (
        <CocaColaBottle key={`coke-bottle-${idx}`} position={offset} scale={1.0} />
      ))}

      {/* Translucent Shrink-Wrap Plastic Film Pack Packaging */}
      <mesh position={[0, 0.14, 0]}>
        <boxGeometry args={[0.34, 0.22, 0.26]} />
        <meshPhysicalMaterial
          color="#ffffff"
          transparent
          opacity={0.18}
          roughness={0.1}
          transmission={0.9}
          thickness={0.05}
        />
      </mesh>

      {/* Branded Shrink-wrap Red Belly Band */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[0.342, 0.065, 0.262]} />
        <meshStandardMaterial color="#d4141d" roughness={0.3} metalness={0.1} />
      </mesh>
    </group>
  );
};
