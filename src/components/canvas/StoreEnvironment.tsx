import React, { useMemo } from 'react';
import * as THREE from 'three';

// Procedural Canvas Texture generator for signs - 100% offline, never suspends
function createSignTexture(
  mainText: string,
  subText: string,
  bgColor: string,
  mainColor: string,
  subColor: string,
  width = 512,
  height = 256
) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);

  // Border frame
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 6;
  ctx.strokeRect(4, 4, width - 8, height - 8);

  // Main Text
  ctx.fillStyle = mainColor;
  ctx.font = 'bold 72px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(mainText, width / 2, height * 0.42);

  // Subtext
  if (subText) {
    ctx.fillStyle = subColor;
    ctx.font = 'bold 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(subText, width / 2, height * 0.75);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 8;
  return tex;
}

export const StoreEnvironment: React.FC = () => {
  // Generate high-key pristine supermarket tile texture for floor
  const floorTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Ultra-clean bright ivory/white marble retail floor
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle pearlescent marble specks
    for (let i = 0; i < 1500; i++) {
      const x = Math.random() * 1024;
      const y = Math.random() * 1024;
      const size = Math.random() * 2 + 1;
      const brightness = Math.floor(Math.random() * 15 + 235);
      ctx.fillStyle = `rgb(${brightness}, ${brightness}, ${brightness + 4})`;
      ctx.fillRect(x, y, size, size);
    }

    // Modern thin clean grout lines (light stone gray)
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.45)';
    ctx.lineWidth = 2.5;

    const tileSize = 128;
    for (let x = 0; x <= 1024; x += tileSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += tileSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(10, 14);
    return tex;
  }, []);

  // Back Wall Brand Logo Texture
  const backBrandTexture = useMemo(() => {
    return createSignTexture('NEXUS MART', 'SAVE MONEY. LIVE BETTER.', '#0071dc', '#ffffff', '#fef08a', 1024, 256);
  }, []);

  // Welcome Entrance Texture
  const welcomeTexture = useMemo(() => {
    return createSignTexture('WELCOME TO NEXUS MART', 'INTERACTIVE 3D STORE', '#0071dc', '#ffffff', '#93c5fd', 1024, 256);
  }, []);

  // Checkout Sign Texture
  const checkoutTexture = useMemo(() => {
    return createSignTexture('SELF CHECKOUT', 'FAST & CONVENIENT', '#16a34a', '#ffffff', '#bbf7d0', 1024, 256);
  }, []);

  return (
    <group>
      {/* --- BRIGHT HIGH-KEY SUPERMARKET LIGHTING --- */}
      <ambientLight intensity={1.15} color="#ffffff" />

      {/* Main architectural ceiling flood lights */}
      <directionalLight
        position={[6, 14, 6]}
        intensity={1.4}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-6, 12, -6]} intensity={1.1} color="#f0f9ff" />
      <directionalLight position={[0, 10, 12]} intensity={0.9} color="#ffffff" />

      {/* Bright warm aisle fill lights */}
      <pointLight position={[0, 4.5, 0]} intensity={1.8} distance={22} color="#ffffff" />
      <pointLight position={[0, 4.5, 9]} intensity={1.6} distance={18} color="#f8fafc" />
      <pointLight position={[0, 4.5, -9]} intensity={1.6} distance={18} color="#f8fafc" />

      {/* --- PRISTINE REFLECTIVE WHITE SUPERMARKET FLOOR --- */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
        <planeGeometry args={[28, 38]} />
        <meshStandardMaterial
          map={floorTexture}
          roughness={0.08}
          metalness={0.12}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Modern crisp Walmart/Target blue guidance line along central promenade */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 1]}>
        <planeGeometry args={[0.08, 32]} />
        <meshStandardMaterial color="#0071dc" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5.5, 0.005, 1]}>
        <planeGeometry args={[0.04, 28]} />
        <meshStandardMaterial color="#0284c7" opacity={0.6} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.5, 0.005, 1]}>
        <planeGeometry args={[0.04, 28]} />
        <meshStandardMaterial color="#0284c7" opacity={0.6} transparent />
      </mesh>

      {/* --- BRIGHT MODERN CEILING WITH CONTINUOUS LED BATTENS --- */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.2, 1]}>
        <planeGeometry args={[28, 38]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.8} />
      </mesh>

      {/* High-output LED light channels along the 4 aisles */}
      {[-6, -2, 2, 6].map((xPos, idx) => (
        <group key={`light-strip-${idx}`} position={[xPos, 5.15, -1]}>
          <mesh>
            <boxGeometry args={[0.3, 0.06, 26]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={3.2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}

      {/* Front Concourse Crosswise Light */}
      <mesh position={[0, 5.15, 11]}>
        <boxGeometry args={[22, 0.06, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffffff"
          emissiveIntensity={3.0}
          toneMapped={false}
        />
      </mesh>

      {/* --- PERIMETER WALLS (BRIGHT CLEAN ARCHITECTURAL) --- */}
      {/* Back Wall with Vibrant Store Branding */}
      <group position={[0, 2.6, -17]}>
        <mesh receiveShadow>
          <boxGeometry args={[28, 5.2, 0.5]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.7} />
        </mesh>
        {/* Accent Wall Center Board */}
        <mesh position={[0, 0, 0.26]}>
          <boxGeometry args={[20, 4.4, 0.05]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
        {/* Store Brand Typography Billboard */}
        <mesh position={[0, 1.0, 0.32]}>
          <planeGeometry args={[6.0, 1.5]} />
          <meshBasicMaterial map={backBrandTexture} />
        </mesh>
      </group>

      {/* Left Wall */}
      <mesh position={[-14, 2.6, 1]} receiveShadow>
        <boxGeometry args={[0.5, 5.2, 38]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[-13.7, 3.2, -1]}>
        <boxGeometry args={[0.04, 0.12, 28]} />
        <meshStandardMaterial color="#0071dc" />
      </mesh>

      {/* Right Wall */}
      <mesh position={[14, 2.6, 1]} receiveShadow>
        <boxGeometry args={[0.5, 5.2, 38]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} />
      </mesh>
      <mesh position={[13.7, 3.2, -1]}>
        <boxGeometry args={[0.04, 0.12, 28]} />
        <meshStandardMaterial color="#0071dc" />
      </mesh>

      {/* --- FRONT ENTRANCE & GLASS SLIDING DOORS --- */}
      <group position={[0, 0, 16]}>
        {/* White Entrance Wall */}
        <mesh position={[-8, 2.6, 0]}>
          <boxGeometry args={[12, 5.2, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[8, 2.6, 0]}>
          <boxGeometry args={[12, 5.2, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>
        <mesh position={[0, 4.4, 0]}>
          <boxGeometry args={[4.2, 1.6, 0.4]} />
          <meshStandardMaterial color="#e2e8f0" />
        </mesh>

        {/* Crisp Aluminum Portal Frame */}
        <mesh position={[0, 2.0, 0.1]}>
          <boxGeometry args={[4.6, 4.2, 0.2]} />
          <meshStandardMaterial color="#0071dc" metalness={0.4} roughness={0.2} />
        </mesh>

        {/* Clear Glass Automatic Sliding Doors */}
        <mesh position={[-1.4, 1.8, 0.15]}>
          <boxGeometry args={[1.5, 3.6, 0.05]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.28}
            roughness={0.02}
            transmission={0.92}
            thickness={0.08}
          />
        </mesh>
        <mesh position={[1.4, 1.8, 0.15]}>
          <boxGeometry args={[1.5, 3.6, 0.05]} />
          <meshPhysicalMaterial
            color="#bae6fd"
            transparent
            opacity={0.28}
            roughness={0.02}
            transmission={0.92}
            thickness={0.08}
          />
        </mesh>

        {/* Bright Welcome Portal Header Billboard */}
        <mesh position={[0, 3.9, 0.3]}>
          <planeGeometry args={[3.8, 0.9]} />
          <meshBasicMaterial map={welcomeTexture} />
        </mesh>
      </group>

      {/* --- 4 MODERN BRIGHT RETAIL SHELF GONDOLAS --- */}
      <BrightShelfUnit
        x={-8}
        aisleNum="01"
        aisleTitle="BEVERAGES & SODA"
        accentColor="#dc2626"
      />
      <BrightShelfUnit
        x={-3}
        aisleNum="02"
        aisleTitle="PANTRY & GROCERIES"
        accentColor="#d97706"
      />
      <BrightShelfUnit
        x={3}
        aisleNum="03"
        aisleTitle="ELECTRONICS & TECH"
        accentColor="#0284c7"
      />
      <BrightShelfUnit
        x={8}
        aisleNum="04"
        aisleTitle="HEALTH & BEAUTY"
        accentColor="#e11d48"
      />

      {/* --- MODERN SELF-CHECKOUT CONCOURSE --- */}
      <BrightCheckoutStation x={9.0} z={9.5} signTexture={checkoutTexture} />
    </group>
  );
};

// Reusable Pristine Supermarket Gondola Shelf Component
const BrightShelfUnit: React.FC<{
  x: number;
  aisleNum: string;
  aisleTitle: string;
  accentColor: string;
}> = ({ x, aisleNum, aisleTitle, accentColor }) => {
  const signTexture = useMemo(() => {
    return createSignTexture(aisleNum, aisleTitle, '#0071dc', '#ffffff', '#fef08a', 512, 256);
  }, [aisleNum, aisleTitle]);

  return (
    <group position={[x, 0, -2]}>
      {/* Crisp White Retail Base Plinth */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.2, 13]} />
        <meshStandardMaterial color="#e2e8f0" metalness={0.2} roughness={0.3} />
      </mesh>

      {/* Central Pegboard Partition */}
      <mesh position={[0, 1.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.08, 2.5, 13]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.4} />
      </mesh>

      {/* End caps with clean modern Walmart-style colored topper */}
      {[-6.5, 6.5].map((zEnd, idx) => (
        <group key={`endcap-${idx}`} position={[0, 1.35, zEnd]}>
          <mesh castShadow>
            <boxGeometry args={[1.45, 2.7, 0.12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.1} roughness={0.3} />
          </mesh>
          {/* Vertical Accent Color Stripe */}
          <mesh position={[0, 0, idx === 0 ? -0.07 : 0.07]}>
            <boxGeometry args={[0.08, 2.5, 0.02]} />
            <meshStandardMaterial color={accentColor} />
          </mesh>
        </group>
      ))}

      {/* 3 Shelf Tiers with Under-Shelf Warm Display Lighting */}
      {[0.5, 1.25, 2.0].map((yHeight, idx) => (
        <group key={`tier-${idx}`} position={[0, yHeight, 0]}>
          {/* Left facing shelf tray (Clean White Powder-Coated Metal) */}
          <mesh position={[-0.45, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.85, 0.05, 12.8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.2} />
          </mesh>
          {/* Under-shelf bright LED light strip */}
          <mesh position={[-0.45, -0.03, 0]}>
            <boxGeometry args={[0.06, 0.015, 12.6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={2.5}
            />
          </mesh>

          {/* Right facing shelf tray */}
          <mesh position={[0.45, 0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.85, 0.05, 12.8]} />
            <meshStandardMaterial color="#ffffff" metalness={0.2} roughness={0.2} />
          </mesh>
          {/* Under-shelf bright LED light strip */}
          <mesh position={[0.45, -0.03, 0]}>
            <boxGeometry args={[0.06, 0.015, 12.6]} />
            <meshStandardMaterial
              color="#ffffff"
              emissive="#ffffff"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>
      ))}

      {/* Modern Suspended Aisle Header Sign */}
      <group position={[0, 3.8, 5.0]}>
        {/* Support Steel Rods from ceiling */}
        <mesh position={[-0.4, 0.7, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>
        <mesh position={[0.4, 0.7, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 1.4]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.8} />
        </mesh>

        {/* Front Sign Plane */}
        <mesh position={[0, 0, 0.045]}>
          <planeGeometry args={[1.6, 0.8]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>

        {/* Back Sign Plane */}
        <mesh position={[0, 0, -0.045]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.6, 0.8]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </group>
    </group>
  );
};

// Bright Clean Self-Checkout Pod
const BrightCheckoutStation: React.FC<{ x: number; z: number; signTexture: THREE.Texture }> = ({ x, z, signTexture }) => {
  return (
    <group position={[x, 0, z]}>
      {/* Checkout Counter Desk (White & Walmart Blue) */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.9, 1.4]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.88, 0]}>
        <boxGeometry args={[2.82, 0.06, 1.42]} />
        <meshStandardMaterial color="#0071dc" roughness={0.2} />
      </mesh>

      {/* Terminal Screen 1 */}
      <group position={[-0.7, 1.15, 0]}>
        <mesh rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.55, 0.42, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.5, 0.36]} />
          <meshStandardMaterial
            color="#0071dc"
            emissive="#0071dc"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* Terminal Screen 2 */}
      <group position={[0.7, 1.15, 0]}>
        <mesh rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.55, 0.42, 0.05]} />
          <meshStandardMaterial color="#1e293b" />
        </mesh>
        <mesh position={[0, 0, 0.03]} rotation={[-0.2, 0, 0]}>
          <planeGeometry args={[0.5, 0.36]} />
          <meshStandardMaterial
            color="#0071dc"
            emissive="#0071dc"
            emissiveIntensity={1.2}
          />
        </mesh>
      </group>

      {/* Overhead Checkout Sign Billboard */}
      <group position={[0, 3.8, 0]}>
        <mesh>
          <planeGeometry args={[2.2, 0.55]} />
          <meshBasicMaterial map={signTexture} />
        </mesh>
      </group>
    </group>
  );
};
