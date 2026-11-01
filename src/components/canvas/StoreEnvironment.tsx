import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StoreEnvironmentProps {
  enableAnimations?: boolean;
  lightIntensityMultiplier?: number;
}

export interface GondolaShelfRunProps {
  position: [number, number, number];
  length?: number;
  aisleIndex: number;
}

export interface OverheadAisleSignProps {
  position: [number, number, number];
  aisleNumber: string;
  leftCategories: string[];
  rightCategories: string[];
}

export interface CoolerWallProps {
  position: [number, number, number];
  unitCount?: number;
}

export interface ProduceTableProps {
  position: [number, number, number];
  rotationY?: number;
  tableIndex: number;
}

export interface MeatCaseProps {
  position: [number, number, number];
  length?: number;
}

export interface CheckoutLaneProps {
  position: [number, number, number];
  laneNumber: number;
  enableAnimations?: boolean;
}

export interface SelfCheckoutPodProps {
  position: [number, number, number];
}

interface InstanceTransform {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
}

interface InstancedStaticMeshProps {
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  instances: InstanceTransform[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// ============================================================================
// REUSABLE INSTANCED MESH BATCHER (SINGLE DRAW-CALL ENGINE)
// ============================================================================

const _tempMatrix = new THREE.Matrix4();
const _tempPosition = new THREE.Vector3();
const _tempQuaternion = new THREE.Quaternion();
const _tempEuler = new THREE.Euler();
const _tempScale = new THREE.Vector3();
const _tempColor = new THREE.Color();

const InstancedStaticMesh: React.FC<InstancedStaticMeshProps> = React.memo(
  ({
    geometry,
    material,
    instances,
    castShadow = false,
    receiveShadow = false,
  }) => {
    const meshRef = useRef<THREE.InstancedMesh>(null);

    useLayoutEffect(() => {
      const mesh = meshRef.current;
      if (!mesh || instances.length === 0) return;

      let hasCustomColor = false;

      for (let i = 0; i < instances.length; i++) {
        const inst = instances[i];
        _tempPosition.set(inst.position[0], inst.position[1], inst.position[2]);

        if (inst.rotation) {
          _tempEuler.set(inst.rotation[0], inst.rotation[1], inst.rotation[2]);
          _tempQuaternion.setFromEuler(_tempEuler);
        } else {
          _tempQuaternion.identity();
        }

        if (inst.scale) {
          _tempScale.set(inst.scale[0], inst.scale[1], inst.scale[2]);
        } else {
          _tempScale.set(1, 1, 1);
        }

        _tempMatrix.compose(_tempPosition, _tempQuaternion, _tempScale);
        mesh.setMatrixAt(i, _tempMatrix);

        if (inst.color) {
          hasCustomColor = true;
          _tempColor.set(inst.color);
          mesh.setColorAt(i, _tempColor);
        }
      }

      mesh.instanceMatrix.needsUpdate = true;
      if (hasCustomColor && mesh.instanceColor) {
        mesh.instanceColor.needsUpdate = true;
      }
      mesh.computeBoundingSphere();
    }, [instances]);

    if (instances.length === 0) return null;

    return (
      <instancedMesh
        ref={meshRef}
        args={[geometry, material, instances.length]}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        frustumCulled={false}
      />
    );
  }
);

InstancedStaticMesh.displayName = 'InstancedStaticMesh';

// ============================================================================
// SINGLETON TEXTURE CACHE & PROCEDURAL GENERATORS (ALLOCATED STRICTLY ONCE)
// ============================================================================

const TEXTURE_CACHE = new Map<string, THREE.CanvasTexture>();

function getOrCreateCachedTexture(
  cacheKey: string,
  builder: () => THREE.CanvasTexture
): THREE.CanvasTexture {
  const existing = TEXTURE_CACHE.get(cacheKey);
  if (existing) return existing;

  const created = builder();
  created.anisotropy = 4;
  created.needsUpdate = true;
  TEXTURE_CACHE.set(cacheKey, created);
  return created;
}

function getTileFloorTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('tile-floor', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#eaedf0';
    ctx.fillRect(0, 0, 1024, 1024);

    const grid = 4;
    const step = 1024 / grid;

    for (let gx = 0; gx < grid; gx++) {
      for (let gy = 0; gy < grid; gy++) {
        const x0 = gx * step;
        const y0 = gy * step;

        const shade = 230 + ((gx * 7 + gy * 13) % 10);
        ctx.fillStyle = `rgb(${shade}, ${shade + 2}, ${shade + 4})`;
        ctx.fillRect(x0 + 3, y0 + 3, step - 6, step - 6);

        const grad = ctx.createLinearGradient(x0, y0, x0 + step, y0 + step);
        grad.addColorStop(0, 'rgba(255,255,255,0.18)');
        grad.addColorStop(0.5, 'rgba(255,255,255,0.0)');
        grad.addColorStop(1, 'rgba(195,205,215,0.15)');
        ctx.fillStyle = grad;
        ctx.fillRect(x0 + 3, y0 + 3, step - 6, step - 6);
      }
    }

    ctx.strokeStyle = '#c2c9d1';
    ctx.lineWidth = 5;
    for (let i = 0; i <= grid; i++) {
      const pos = i * step;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, 1024);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(1024, pos);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(22, 27);
    return texture;
  });
}

function getPegboardTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('pegboard', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#e5e7eb';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#9ca3af';
    const spacing = 16;
    for (let x = spacing / 2; x < 256; x += spacing) {
      for (let y = spacing / 2; y < 256; y += spacing) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(14, 4);
    return texture;
  });
}

function getPriceRailTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('price-rail', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0071ce';
    ctx.fillRect(0, 0, 1024, 64);

    ctx.fillStyle = '#ffc220';
    ctx.fillRect(0, 0, 1024, 10);

    const tagCount = 12;
    const slotWidth = 1024 / tagCount;
    for (let i = 0; i < tagCount; i++) {
      const tx = i * slotWidth + 12;
      const tw = slotWidth - 24;

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx, 14, tw, 42);

      ctx.fillStyle = i % 3 === 0 ? '#e11d48' : '#ffc220';
      ctx.fillRect(tx + 2, 16, tw * 0.42, 24);

      ctx.fillStyle = i % 3 === 0 ? '#ffffff' : '#111827';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.fillText(`$${(1 + ((i * 3) % 8)).toString()}.98`, tx + 5, 33);

      ctx.fillStyle = '#1f2937';
      for (let b = 0; b < 14; b++) {
        const bw = (b % 3) + 1;
        ctx.fillRect(tx + 6 + b * 4, 44, bw, 9);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    texture.repeat.set(4, 1);
    return texture;
  });
}

function getDepartmentBannerTexture(
  title: string,
  subtitle: string,
  bgColor = '#0071ce',
  accentColor = '#ffc220'
): THREE.CanvasTexture {
  const key = `banner:${title}:${subtitle}:${bgColor}:${accentColor}`;
  return getOrCreateCachedTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, 2048, 256);

    ctx.fillStyle = accentColor;
    ctx.fillRect(0, 228, 2048, 28);

    const drawSpark = (cx: number, cy: number, radius: number) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 12;
      ctx.lineCap = 'round';
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        ctx.beginPath();
        ctx.moveTo(
          Math.cos(angle) * (radius * 0.45),
          Math.sin(angle) * (radius * 0.45)
        );
        ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.stroke();
      }
      ctx.restore();
    };

    drawSpark(180, 114, 58);
    drawSpark(1868, 114, 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 92px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 1024, 96);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 42px Arial, sans-serif';
    ctx.fillText(subtitle, 1024, 178);

    return new THREE.CanvasTexture(canvas);
  });
}

function getAisleSignTexture(
  aisleNumber: string,
  leftItems: string[],
  rightItems: string[]
): THREE.CanvasTexture {
  const key = `aisle:${aisleNumber}:${leftItems.join(',')}:${rightItems.join(',')}`;
  return getOrCreateCachedTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0071ce';
    ctx.fillRect(0, 0, 1024, 512);

    ctx.fillStyle = '#ffc220';
    ctx.fillRect(0, 0, 1024, 18);
    ctx.fillRect(0, 494, 1024, 18);

    ctx.fillStyle = '#ffc220';
    ctx.beginPath();
    ctx.roundRect(382, 36, 260, 180, 20);
    ctx.fill();

    ctx.fillStyle = '#003057';
    ctx.font = 'bold 36px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AISLE', 512, 86);

    ctx.font = 'bold 96px Arial, sans-serif';
    ctx.fillText(aisleNumber, 512, 182);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 38px Arial, sans-serif';
    ctx.textAlign = 'left';
    leftItems.forEach((item, idx) => {
      ctx.fillText(`◄ ${item}`, 48, 285 + idx * 62);
    });

    ctx.textAlign = 'right';
    rightItems.forEach((item, idx) => {
      ctx.fillText(`${item} ►`, 976, 285 + idx * 62);
    });

    return new THREE.CanvasTexture(canvas);
  });
}

function getChalkboardTexture(
  title: string,
  price: string,
  unit: string
): THREE.CanvasTexture {
  const key = `chalk:${title}:${price}:${unit}`;
  return getOrCreateCachedTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, 512, 256);

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, 494, 238);

    ctx.fillStyle = '#86efac';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('FARM FRESH ORGANIC', 256, 58);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 46px Arial, sans-serif';
    ctx.fillText(title, 256, 118);

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 72px Arial, sans-serif';
    ctx.fillText(price, 230, 205);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(unit, 355, 195);

    return new THREE.CanvasTexture(canvas);
  });
}

function getConveyorBeltTexture(): THREE.CanvasTexture {
  return getOrCreateCachedTexture('conveyor-belt', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1f2428';
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#2a3036';
    for (let y = 0; y < 256; y += 16) {
      ctx.fillRect(0, y, 256, 6);
    }

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(0, 120, 256, 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, 4);
    return texture;
  });
}

function getPOSMonitorTexture(title: string): THREE.CanvasTexture {
  const key = `pos:${title}`;
  return getOrCreateCachedTexture(key, () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 384;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, 512, 384);

    ctx.fillStyle = '#0071ce';
    ctx.fillRect(0, 0, 512, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px Arial, sans-serif';
    ctx.fillText(title, 24, 42);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 84, 260, 276);

    ctx.fillStyle = '#1e293b';
    ctx.font = '20px monospace';
    ctx.fillText('ORGANIC BANANAS   $1.48', 32, 120);
    ctx.fillText('WHOLE MILK 1GAL   $3.68', 32, 152);
    ctx.fillText('ARTISAN BREAD     $2.98', 32, 184);
    ctx.fillText('PRIME RIBEYE      $14.88', 32, 216);
    ctx.fillText('------------------------', 32, 260);
    ctx.font = 'bold 24px monospace';
    ctx.fillText('TOTAL            $23.02', 32, 300);

    const colors = ['#22c55e', '#eab308', '#3b82f6', '#ef4444'];
    const labels = ['PAY NOW', 'LOOKUP', 'BAG FEE', 'HELP'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      ctx.fillRect(300, 84 + i * 70, 192, 56);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px Arial, sans-serif';
      ctx.fillText(labels[i], 335, 120 + i * 70);
    }

    return new THREE.CanvasTexture(canvas);
  });
}

// ============================================================================
// SHARED SINGLETON GEOMETRIES & MATERIALS (ZERO REDUNDANT GPU ALLOCATIONS)
// ============================================================================

const UNIT_BOX_GEO = new THREE.BoxGeometry(1, 1, 1);
const UNIT_CYLINDER_GEO = new THREE.CylinderGeometry(1, 1, 1, 12);
const UNIT_SPHERE_GEO = new THREE.SphereGeometry(1, 12, 10);
const UNIT_PLANE_GEO = new THREE.PlaneGeometry(1, 1);

const SHARED_MATERIALS = {
  darkCharcoalCeiling: new THREE.MeshStandardMaterial({
    color: '#1a1f26',
    roughness: 0.85,
    metalness: 0.2,
  }),
  darkCharcoalTruss: new THREE.MeshStandardMaterial({
    color: '#1a1f26',
    roughness: 0.6,
    metalness: 0.45,
  }),
  ledBattenHousing: new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.35,
    metalness: 0.6,
  }),
  ledBattenDiffuser: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#ffffff',
    emissiveIntensity: 2.5,
    roughness: 0.1,
  }),
  coolerLedStrip: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    emissive: '#e0f2fe',
    emissiveIntensity: 2.6,
  }),
  galvanizedSteel: new THREE.MeshStandardMaterial({
    color: '#cbd5e1',
    metalness: 0.75,
    roughness: 0.25,
  }),
  chrome: new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    metalness: 0.95,
    roughness: 0.1,
  }),
  brushedAluminum: new THREE.MeshStandardMaterial({
    color: '#94a3b8',
    metalness: 0.82,
    roughness: 0.22,
  }),
  darkSlateMetal: new THREE.MeshStandardMaterial({
    color: '#1e293b',
    roughness: 0.45,
    metalness: 0.45,
  }),
  mediumSlateMetal: new THREE.MeshStandardMaterial({
    color: '#334155',
    roughness: 0.42,
    metalness: 0.4,
  }),
  gondolaUprightSteel: new THREE.MeshStandardMaterial({
    color: '#64748b',
    metalness: 0.75,
    roughness: 0.28,
  }),
  shelfDeckSteel: new THREE.MeshStandardMaterial({
    color: '#e2e8f0',
    metalness: 0.45,
    roughness: 0.35,
  }),
  walmartBlue: new THREE.MeshStandardMaterial({
    color: '#0071ce',
    roughness: 0.32,
    metalness: 0.15,
  }),
  walmartYellow: new THREE.MeshStandardMaterial({
    color: '#ffc220',
    roughness: 0.3,
  }),
  safetyYellow: new THREE.MeshStandardMaterial({
    color: '#eab308',
    roughness: 0.35,
  }),
  cleanWhite: new THREE.MeshStandardMaterial({
    color: '#f8fafc',
    roughness: 0.35,
  }),
  brandLabelYellow: new THREE.MeshStandardMaterial({
    color: '#fef08a',
    roughness: 0.3,
  }),
  bottleCapBlue: new THREE.MeshStandardMaterial({
    color: '#0284c7',
    roughness: 0.3,
  }),
  instancedProductMatte: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.34,
    metalness: 0.05,
  }),
  instancedCanGloss: new THREE.MeshStandardMaterial({
    color: '#ffffff',
    roughness: 0.26,
    metalness: 0.18,
  }),
  coolerGlass: new THREE.MeshPhysicalMaterial({
    color: '#f0f9ff',
    transparent: true,
    opacity: 0.26,
    transmission: 0.82,
    ior: 1.52,
    roughness: 0.05,
    metalness: 0.05,
  }),
  woodDark: new THREE.MeshStandardMaterial({
    color: '#78350f',
    roughness: 0.75,
  }),
  woodMedium: new THREE.MeshStandardMaterial({
    color: '#92400e',
    roughness: 0.68,
  }),
  woodLight: new THREE.MeshStandardMaterial({
    color: '#b45309',
    roughness: 0.62,
  }),
  wickerBasket: new THREE.MeshStandardMaterial({
    color: '#d97706',
    roughness: 0.8,
  }),
};

// ============================================================================
// SUB-COMPONENT: STORE ARCHITECTURE & OPTIMIZED LIGHTING PIPELINE
// ============================================================================

const StoreArchitecture: React.FC<{ lightIntensityMultiplier: number }> =
  React.memo(({ lightIntensityMultiplier }) => {
    const floorTexture = useMemo(() => getTileFloorTexture(), []);
    const welcomeBanner = useMemo(
      () =>
        getDepartmentBannerTexture(
          'WELCOME TO WALMART SUPERCENTER',
          'SAVE MONEY. LIVE BETTER. • EVERYDAY LOW PRICES',
          '#0071ce',
          '#ffc220'
        ),
      []
    );
    const dairyBanner = useMemo(
      () =>
        getDepartmentBannerTexture(
          'DAIRY • CHILLED • BEVERAGES',
          'FARM FRESH MILK • YOGURT • JUICES • CRAFT SODAS',
          '#0284c7',
          '#bae6fd'
        ),
      []
    );
    const produceBanner = useMemo(
      () =>
        getDepartmentBannerTexture(
          'FARM FRESH PRODUCE MARKET',
          '100% ORGANIC FRUITS • CRISP GREENS • LOCAL HARVEST',
          '#15803d',
          '#fde047'
        ),
      []
    );
    const butcherBanner = useMemo(
      () =>
        getDepartmentBannerTexture(
          'QUALITY MEAT & ARTISAN DELI',
          'USDA CHOICE STEAKS • FRESH POULTRY • SLICED DELI',
          '#991b1b',
          '#fef08a'
        ),
      []
    );

    // Batch structural steel columns, ceiling trusses, HVAC vents, and LED battens
    const {
      columnShaftInstances,
      columnBumperInstances,
      columnStripeInstances,
      trussChordInstances,
      ledHousingInstances,
      ledDiffuserInstances,
      hvacVentInstances,
    } = useMemo(() => {
      const colCoords: [number, number][] = [
        [-11, -18],
        [11, -18],
        [-11, -6],
        [11, -6],
        [-11, 6],
        [11, 6],
        [-11, 18],
        [11, 18],
      ];

      const columnShafts: InstanceTransform[] = [];
      const columnBumpers: InstanceTransform[] = [];
      const columnStripes: InstanceTransform[] = [];

      colCoords.forEach(([cx, cz]) => {
        columnShafts.push({
          position: [cx, 3.1, cz],
          scale: [0.42, 6.2, 0.42],
        });
        columnBumpers.push({
          position: [cx, 0.6, cz],
          scale: [0.48, 1.2, 0.48],
        });
        columnStripes.push({
          position: [cx, 3.8, cz],
          scale: [0.45, 0.45, 0.45],
        });
      });

      const trussZ = [-24, -18, -12, -6, 0, 6, 12, 18, 24];
      const trussChords: InstanceTransform[] = [];
      trussZ.forEach((z) => {
        // Top chord
        trussChords.push({
          position: [0, 6.07, z],
          scale: [43.6, 0.12, 0.22],
        });
        // Bottom chord
        trussChords.push({
          position: [0, 5.77, z],
          scale: [43.6, 0.12, 0.22],
        });
        // Vertical web struts across span
        for (let wx = -18; wx <= 18; wx += 6) {
          trussChords.push({
            position: [wx, 5.92, z],
            scale: [0.1, 0.28, 0.16],
          });
        }
      });

      const ledX = [-16, -8, 0, 8, 16];
      const ledHousings: InstanceTransform[] = [];
      const ledDiffusers: InstanceTransform[] = [];
      ledX.forEach((x) => {
        ledHousings.push({
          position: [x, 5.77, 0],
          scale: [0.24, 0.08, 50],
        });
        ledDiffusers.push({
          position: [x, 5.71, 0],
          scale: [0.16, 0.04, 50],
        });
      });

      const hvacVents: InstanceTransform[] = [];
      [-13, 13].forEach((x) => {
        [-20, -10, 0, 10, 20].forEach((vz) => {
          hvacVents.push({
            position: [x, 5.13, vz],
            scale: [0.3, 0.18, 0.3],
          });
        });
      });

      return {
        columnShaftInstances: columnShafts,
        columnBumperInstances: columnBumpers,
        columnStripeInstances: columnStripes,
        trussChordInstances: trussChords,
        ledHousingInstances: ledHousings,
        ledDiffuserInstances: ledDiffusers,
        hvacVentInstances: hvacVents,
      };
    }, []);

    return (
      <group name="StoreArchitecture">
        {/* ==================== OPTIMIZED LIGHTING PIPELINE ==================== */}
        <ambientLight
          intensity={0.68 * lightIntensityMultiplier}
          color="#f8fafc"
        />
        <hemisphereLight
          args={['#ffffff', '#1e293b', 0.85 * lightIntensityMultiplier]}
          position={[0, 6.2, 0]}
        />

        {/* Primary High-Bay Downward Directional Light (Single Shadow Pass) */}
        <directionalLight
          position={[8, 18, 10]}
          intensity={1.65 * lightIntensityMultiplier}
          color="#f8fafc"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0004}
          shadow-camera-near={1}
          shadow-camera-far={45}
          shadow-camera-left={-24}
          shadow-camera-right={24}
          shadow-camera-top={28}
          shadow-camera-bottom={-28}
        />

        {/* Secondary Soft Fill Directional Light (Zero Shadow Overhead) */}
        <directionalLight
          position={[-12, 14, -12]}
          intensity={0.75 * lightIntensityMultiplier}
          color="#e0f2fe"
        />

        {/* ==================== FLOOR & WAYFINDING STRIPES ==================== */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[44, 54]} />
          <meshStandardMaterial
            map={floorTexture}
            roughness={0.22}
            metalness={0.08}
          />
        </mesh>

        {/* Action Alley Wayfinding Floor Stripes */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.004, 12.5]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <planeGeometry args={[36, 0.35]} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.004, -13.5]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <planeGeometry args={[36, 0.35]} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-11.5, 0.004, -0.5]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <planeGeometry args={[0.35, 26.35]} />
        </mesh>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[11.5, 0.004, -0.5]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <planeGeometry args={[0.35, 26.35]} />
        </mesh>

        {/* ==================== INSTANCED COLUMNS, TRUSSES & LED BATTENS ==================== */}
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.cleanWhite}
          instances={columnShaftInstances}
          castShadow
          receiveShadow
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.safetyYellow}
          instances={columnBumperInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.walmartBlue}
          instances={columnStripeInstances}
        />

        {/* Dark Industrial Charcoal Ceiling Deck (Y = 6.2) */}
        <mesh
          rotation={[Math.PI / 2, 0, 0]}
          position={[0, 6.2, 0]}
          material={SHARED_MATERIALS.darkCharcoalCeiling}
        >
          <planeGeometry args={[44, 54]} />
        </mesh>

        {/* Dark Industrial Charcoal Ceiling Rafters / Trusses */}
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.darkCharcoalTruss}
          instances={trussChordInstances}
        />

        {/* Continuous High-Output Linear LED Batten Strips (emissive="#ffffff", emissiveIntensity=2.5) */}
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.ledBattenHousing}
          instances={ledHousingInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.ledBattenDiffuser}
          instances={ledDiffuserInstances}
        />

        {/* Galvanized Spiral HVAC Ventilation Ducts */}
        {[-13, 13].map((x) => (
          <mesh
            key={`hvac-${x}`}
            position={[x, 5.55, 0]}
            rotation={[Math.PI / 2, 0, 0]}
            material={SHARED_MATERIALS.galvanizedSteel}
          >
            <cylinderGeometry args={[0.45, 0.45, 50, 20]} />
          </mesh>
        ))}
        <InstancedStaticMesh
          geometry={UNIT_CYLINDER_GEO}
          material={SHARED_MATERIALS.brushedAluminum}
          instances={hvacVentInstances}
        />

        {/* ==================== PERIMETER WALLS ==================== */}
        {/* Back Wall (Z = -27) */}
        <group position={[0, 0, -27]}>
          <mesh position={[0, 3.1, 0]} receiveShadow>
            <boxGeometry args={[44, 6.2, 0.4]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          <mesh
            position={[0, 5.1, 0.21]}
            material={SHARED_MATERIALS.walmartBlue}
          >
            <boxGeometry args={[43.6, 1.6, 0.05]} />
          </mesh>
          <mesh position={[0, 4.6, 0.26]}>
            <planeGeometry args={[24, 2.6]} />
            <meshStandardMaterial map={dairyBanner} roughness={0.3} />
          </mesh>
        </group>

        {/* Left Wall (X = -22) - Butcher & Deli */}
        <group position={[-22, 0, 0]}>
          <mesh position={[0, 3.1, 0]} receiveShadow>
            <boxGeometry args={[0.4, 6.2, 54]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          <mesh position={[0.22, 2.0, -2]}>
            <boxGeometry args={[0.04, 4.0, 32]} />
            <meshStandardMaterial color="#fef2f2" roughness={0.3} />
          </mesh>
          <mesh position={[0.25, 4.6, -2]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[24, 2.6]} />
            <meshStandardMaterial map={butcherBanner} roughness={0.3} />
          </mesh>
        </group>

        {/* Right Wall (X = +22) - Farm Fresh Produce */}
        <group position={[22, 0, 0]}>
          <mesh position={[0, 3.1, 0]} receiveShadow>
            <boxGeometry args={[0.4, 6.2, 54]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
          <mesh position={[-0.22, 2.0, -2]}>
            <boxGeometry args={[0.04, 4.0, 32]} />
            <meshStandardMaterial color="#f0fdf4" roughness={0.4} />
          </mesh>
          <mesh position={[-0.25, 4.6, -2]} rotation={[0, -Math.PI / 2, 0]}>
            <planeGeometry args={[24, 2.6]} />
            <meshStandardMaterial map={produceBanner} roughness={0.3} />
          </mesh>
        </group>

        {/* ==================== FRONT ENTRANCE WALL (Z = +26.5) ==================== */}
        <group position={[0, 0, 26.5]}>
          <mesh position={[-14.5, 3.1, 0]}>
            <boxGeometry args={[15, 6.2, 0.45]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>
          <mesh position={[14.5, 3.1, 0]}>
            <boxGeometry args={[15, 6.2, 0.45]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
          </mesh>
          <mesh
            position={[0, 4.65, 0]}
            material={SHARED_MATERIALS.walmartBlue}
          >
            <boxGeometry args={[14, 3.1, 0.45]} />
          </mesh>

          <mesh position={[0, 4.65, -0.25]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[16, 2.2]} />
            <meshStandardMaterial map={welcomeBanner} roughness={0.25} />
          </mesh>

          {/* Sliding Door Aluminum Header & Mullions */}
          <mesh
            position={[0, 3.05, 0]}
            material={SHARED_MATERIALS.brushedAluminum}
          >
            <boxGeometry args={[14, 0.18, 0.25]} />
          </mesh>
          {[-6.9, -3.5, 0, 3.5, 6.9].map((mx) => (
            <mesh
              key={`mullion-${mx}`}
              position={[mx, 1.5, 0]}
              material={SHARED_MATERIALS.brushedAluminum}
            >
              <boxGeometry args={[0.12, 3.0, 0.2]} />
            </mesh>
          ))}

          {/* Fixed Side Glass Panels & Sliding Center Doors */}
          {[-5.2, -1.9, 1.9, 5.2].map((gx, i) => (
            <group
              key={`door-panel-${i}`}
              position={[gx, 1.5, i === 1 || i === 2 ? 0.06 : -0.04]}
            >
              <mesh material={SHARED_MATERIALS.coolerGlass}>
                <boxGeometry args={[3.15, 2.88, 0.04]} />
              </mesh>
              <mesh
                position={[0, 0, 0]}
                material={SHARED_MATERIALS.walmartYellow}
              >
                <boxGeometry args={[3.15, 0.14, 0.05]} />
              </mesh>
            </group>
          ))}

          {/* Entrance Floor Mat */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -2.2]}>
            <planeGeometry args={[11, 3.4]} />
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>

          {/* Anti-Theft EAS Security Pedestals */}
          {[-2.8, 0, 2.8].map((sx) => (
            <group key={`eas-${sx}`} position={[sx, 0, -1.6]}>
              <mesh
                position={[0, 0.85, 0]}
                material={SHARED_MATERIALS.shelfDeckSteel}
              >
                <boxGeometry args={[0.12, 1.7, 0.45]} />
              </mesh>
              <mesh position={[0, 1.55, 0]}>
                <boxGeometry args={[0.14, 0.18, 0.47]} />
                <meshStandardMaterial
                  color="#0071ce"
                  emissive="#0071ce"
                  emissiveIntensity={0.6}
                />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    );
  });

StoreArchitecture.displayName = 'StoreArchitecture';

// ============================================================================
// SUB-COMPONENT: BACK WALL REFRIGERATED COOLER WALL (Z = -25) — INSTANCED
// ============================================================================

const BEVERAGE_PALETTE = [
  '#ffffff',
  '#38bdf8',
  '#ef4444',
  '#f97316',
  '#22c55e',
  '#eab308',
];

export const CoolerWall: React.FC<CoolerWallProps> = React.memo(
  ({ position, unitCount = 14 }) => {
    const unitWidth = 2.4;
    const unitHeight = 2.5;
    const unitDepth = 1.05;
    const totalWidth = unitCount * unitWidth;
    const startX = -totalWidth / 2 + unitWidth / 2;

    const {
      baseInstances,
      backPanelInstances,
      canopyInstances,
      sideWallInstances,
      ledStripInstances,
      wireShelfInstances,
      bottleInstances,
      capInstances,
      doorFrameInstances,
      glassPaneInstances,
      handleInstances,
    } = useMemo(() => {
      const bases: InstanceTransform[] = [];
      const backs: InstanceTransform[] = [];
      const canopies: InstanceTransform[] = [];
      const sideWalls: InstanceTransform[] = [];
      const ledStrips: InstanceTransform[] = [];
      const wireShelves: InstanceTransform[] = [];
      const bottles: InstanceTransform[] = [];
      const caps: InstanceTransform[] = [];
      const doorFrames: InstanceTransform[] = [];
      const glassPanes: InstanceTransform[] = [];
      const handles: InstanceTransform[] = [];

      const shelfYPositions = [0.42, 0.8, 1.18, 1.56, 1.94];
      const bottleXOffsets = [-0.85, -0.5, -0.15, 0.2, 0.55, 0.88];

      for (let uIdx = 0; uIdx < unitCount; uIdx++) {
        const ux = startX + uIdx * unitWidth;

        bases.push({
          position: [ux, 0.16, 0],
          scale: [unitWidth - 0.02, 0.32, unitDepth],
        });

        backs.push({
          position: [ux, unitHeight / 2, -unitDepth / 2 + 0.04],
          scale: [unitWidth - 0.04, unitHeight, 0.08],
        });

        canopies.push({
          position: [ux, 2.41, 0],
          scale: [unitWidth - 0.02, 0.18, unitDepth + 0.06],
        });

        [-unitWidth / 2 + 0.03, unitWidth / 2 - 0.03].forEach((sx) => {
          sideWalls.push({
            position: [ux + sx, unitHeight / 2, 0],
            scale: [0.05, unitHeight, unitDepth],
          });
        });

        [-unitWidth / 2 + 0.08, 0, unitWidth / 2 - 0.08].forEach((lx) => {
          ledStrips.push({
            position: [ux + lx, 1.32, 0.42],
            scale: [0.03, 1.92, 0.03],
          });
        });

        shelfYPositions.forEach((sy, sIdx) => {
          wireShelves.push({
            position: [ux, sy, -0.04],
            scale: [unitWidth - 0.14, 0.025, unitDepth - 0.22],
          });

          const itemColor =
            BEVERAGE_PALETTE[(uIdx + sIdx) % BEVERAGE_PALETTE.length];

          bottleXOffsets.forEach((px) => {
            bottles.push({
              position: [ux + px, sy + 0.14, 0.01],
              scale: [0.105, 0.25, 0.105],
              color: itemColor,
            });
            caps.push({
              position: [ux + px, sy + 0.28, 0.01],
              scale: [0.04, 0.04, 0.04],
            });
          });
        });

        [-unitWidth / 4, unitWidth / 4].forEach((dx, dIdx) => {
          const doorX = ux + dx;
          const doorZ = unitDepth / 2;

          doorFrames.push({
            position: [doorX, 1.32 + 0.98, doorZ],
            scale: [unitWidth / 2 - 0.04, 0.04, 0.04],
          });
          doorFrames.push({
            position: [doorX, 1.32 - 0.98, doorZ],
            scale: [unitWidth / 2 - 0.04, 0.04, 0.04],
          });

          glassPanes.push({
            position: [doorX, 1.32, doorZ],
            scale: [unitWidth / 2 - 0.08, 1.92, 0.025],
          });

          const handleOffset =
            dIdx === 0 ? unitWidth / 4 - 0.12 : -unitWidth / 4 + 0.12;
          handles.push({
            position: [doorX + handleOffset, 1.32, doorZ + 0.045],
            scale: [0.014, 0.55, 0.014],
          });
        });
      }

      return {
        baseInstances: bases,
        backPanelInstances: backs,
        canopyInstances: canopies,
        sideWallInstances: sideWalls,
        ledStripInstances: ledStrips,
        wireShelfInstances: wireShelves,
        bottleInstances: bottles,
        capInstances: caps,
        doorFrameInstances: doorFrames,
        glassPaneInstances: glassPanes,
        handleInstances: handles,
      };
    }, [startX, unitCount, unitDepth, unitHeight, unitWidth]);

    return (
      <group position={position} name="CoolerWall">
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.darkSlateMetal}
          instances={baseInstances}
          castShadow
          receiveShadow
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.cleanWhite}
          instances={backPanelInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.walmartBlue}
          instances={canopyInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.mediumSlateMetal}
          instances={sideWallInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.coolerLedStrip}
          instances={ledStripInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.galvanizedSteel}
          instances={wireShelfInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_CYLINDER_GEO}
          material={SHARED_MATERIALS.instancedProductMatte}
          instances={bottleInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_CYLINDER_GEO}
          material={SHARED_MATERIALS.bottleCapBlue}
          instances={capInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.brushedAluminum}
          instances={doorFrameInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.coolerGlass}
          instances={glassPaneInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_CYLINDER_GEO}
          material={SHARED_MATERIALS.chrome}
          instances={handleInstances}
        />
      </group>
    );
  }
);

CoolerWall.displayName = 'CoolerWall';

// ============================================================================
// SUB-COMPONENT: FARM FRESH PRODUCE DISPLAY TABLE (X = +15) — INSTANCED
// ============================================================================

const PRODUCE_CONFIGS = [
  {
    name: 'HONEYCRISP APPLES',
    price: '$1.98',
    unit: '/ lb',
    colors: ['#dc2626', '#16a34a', '#eab308', '#ef4444'],
  },
  {
    name: 'RIPE BANANAS & CITRUS',
    price: '$0.58',
    unit: '/ lb',
    colors: ['#facc15', '#f97316', '#fde047', '#fb923c'],
  },
  {
    name: 'HEIRLOOM TOMATOES',
    price: '$2.48',
    unit: '/ lb',
    colors: ['#ef4444', '#b91c1c', '#f59e0b', '#15803d'],
  },
  {
    name: 'ORGANIC AVOCADOS',
    price: '$1.28',
    unit: 'each',
    colors: ['#14532d', '#166534', '#4d7c0f', '#365314'],
  },
];

export const ProduceTable: React.FC<ProduceTableProps> = React.memo(
  ({ position, rotationY = 0, tableIndex }) => {
    const cfg = PRODUCE_CONFIGS[tableIndex % PRODUCE_CONFIGS.length];
    const signTexture = useMemo(
      () => getChalkboardTexture(cfg.name, cfg.price, cfg.unit),
      [cfg.name, cfg.price, cfg.unit]
    );

    const tableWidth = 3.2;
    const tableDepth = 2.0;

    // Batch all wooden legs, risers, baskets, mounds, and 72 individual fruits into single instanced draw calls
    const {
      darkWoodInstances,
      wickerInstances,
      produceSphereInstances,
    } = useMemo(() => {
      const darkWood: InstanceTransform[] = [];
      const wicker: InstanceTransform[] = [];
      const spheres: InstanceTransform[] = [];

      // 4 Timber Legs
      [-1.35, 1.35].forEach((lx) => {
        [-0.75, 0.75].forEach((lz) => {
          darkWood.push({
            position: [lx, 0.42, lz],
            scale: [0.12, 0.84, 0.12],
          });
        });
      });

      // 2 Vertical Riser Posts
      [-1.2, 1.2].forEach((rx) => {
        darkWood.push({
          position: [rx, 1.16, 0],
          scale: [0.08, 0.48, 0.08],
        });
      });

      // Top Chalkboard Backing Frame
      darkWood.push({
        position: [0, 1.95, 0],
        scale: [1.35, 0.42, 0.04],
      });

      // 4 Top-Tier Wicker Baskets + Top Produce Mounds
      [-1.0, -0.33, 0.33, 1.0].forEach((wx, wIdx) => {
        wicker.push({
          position: [wx, 1.48, 0],
          scale: [0.55, 0.12, 0.44],
        });
        spheres.push({
          position: [wx, 1.56, 0],
          scale: [0.22, 0.1, 0.18],
          color: cfg.colors[(wIdx + 1) % cfg.colors.length],
        });
      });

      // Slanted Trays: Partition Dividers, Bulk Mounds & Fruit Spheres (Transformed into Table Space)
      const qSide = new THREE.Quaternion();
      const vLocal = new THREE.Vector3();

      [-1, 1].forEach((side) => {
        const trayOriginY = 0.88;
        const trayOriginZ = side * 0.48;
        const tiltAngle = side * 0.22;
        qSide.setFromEuler(new THREE.Euler(tiltAngle, 0, 0));

        for (let binIdx = 0; binIdx < 4; binIdx++) {
          const bx = -1.15 + binIdx * 0.76;
          const binColor = cfg.colors[binIdx % cfg.colors.length];

          if (binIdx < 3) {
            vLocal.set(bx + 0.38, 0.12, 0).applyQuaternion(qSide);
            darkWood.push({
              position: [
                vLocal.x,
                trayOriginY + vLocal.y,
                trayOriginZ + vLocal.z,
              ],
              rotation: [tiltAngle, 0, 0],
              scale: [0.04, 0.14, 0.84],
            });
          }

          // Bulk Mound Base
          vLocal.set(bx, 0.12, 0).applyQuaternion(qSide);
          spheres.push({
            position: [
              vLocal.x,
              trayOriginY + vLocal.y,
              trayOriginZ + vLocal.z,
            ],
            rotation: [tiltAngle, 0, 0],
            scale: [0.32, 0.144, 0.368],
            color: binColor,
          });

          // Individual Fruit Accent Spheres
          [-0.14, 0, 0.14].forEach((fx) => {
            [-0.18, 0, 0.18].forEach((fz) => {
              vLocal.set(bx + fx, 0.22, fz).applyQuaternion(qSide);
              spheres.push({
                position: [
                  vLocal.x,
                  trayOriginY + vLocal.y,
                  trayOriginZ + vLocal.z,
                ],
                scale: [0.075, 0.075, 0.075],
                color: binColor,
              });
            });
          });
        }
      });

      return {
        darkWoodInstances: darkWood,
        wickerInstances: wicker,
        produceSphereInstances: spheres,
      };
    }, [cfg.colors]);

    return (
      <group
        position={position}
        rotation={[0, rotationY, 0]}
        name={`ProduceTable-${tableIndex}`}
      >
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.woodDark}
          instances={darkWoodInstances}
          castShadow
          receiveShadow
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.wickerBasket}
          instances={wickerInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_SPHERE_GEO}
          material={SHARED_MATERIALS.instancedProductMatte}
          instances={produceSphereInstances}
          castShadow
        />

        {/* Lower Storage Crate Base Shelf */}
        <mesh
          position={[0, 0.25, 0]}
          receiveShadow
          material={SHARED_MATERIALS.woodMedium}
        >
          <boxGeometry args={[tableWidth - 0.2, 0.06, tableDepth - 0.2]} />
        </mesh>

        {/* Dual Slanted Wooden Bin Trays */}
        {[-1, 1].map((side) => (
          <group
            key={`tray-${side}`}
            position={[0, 0.88, side * 0.48]}
            rotation={[side * 0.22, 0, 0]}
          >
            <mesh
              castShadow
              receiveShadow
              material={SHARED_MATERIALS.woodLight}
            >
              <boxGeometry args={[tableWidth, 0.12, 0.92]} />
            </mesh>
            <mesh
              position={[0, 0.1, 0.43]}
              material={SHARED_MATERIALS.woodMedium}
            >
              <boxGeometry args={[tableWidth, 0.14, 0.05]} />
            </mesh>
            <mesh
              position={[0, 0.1, -0.43]}
              material={SHARED_MATERIALS.woodMedium}
            >
              <boxGeometry args={[tableWidth, 0.14, 0.05]} />
            </mesh>
          </group>
        ))}

        {/* Elevated Center Wooden Riser Tray */}
        <mesh
          position={[0, 1.38, 0]}
          castShadow
          material={SHARED_MATERIALS.woodLight}
        >
          <boxGeometry args={[tableWidth - 0.1, 0.08, 0.56]} />
        </mesh>

        {/* Overhead Black Iron Sign Frame */}
        {[-1.35, 1.35].map((px) => (
          <mesh
            key={`sign-post-${px}`}
            position={[px, 1.55, 0]}
            material={SHARED_MATERIALS.darkSlateMetal}
          >
            <cylinderGeometry args={[0.02, 0.02, 1.35, 10]} />
          </mesh>
        ))}
        <mesh
          position={[0, 2.22, 0]}
          rotation={[0, 0, Math.PI / 2]}
          material={SHARED_MATERIALS.darkSlateMetal}
        >
          <cylinderGeometry args={[0.02, 0.02, 2.74, 10]} />
        </mesh>

        {/* Double-Sided Chalkboard Price Sign */}
        <mesh position={[0, 1.95, 0.022]}>
          <planeGeometry args={[1.3, 0.38]} />
          <meshStandardMaterial map={signTexture} roughness={0.5} />
        </mesh>
        <mesh
          position={[0, 1.95, -0.022]}
          rotation={[0, Math.PI, 0]}
        >
          <planeGeometry args={[1.3, 0.38]} />
          <meshStandardMaterial map={signTexture} roughness={0.5} />
        </mesh>
      </group>
    );
  }
);

ProduceTable.displayName = 'ProduceTable';

// ============================================================================
// SUB-COMPONENT: BUTCHER MEAT & DELI CHILLED SHOWCASE (X = -18) — INSTANCED
// ============================================================================

export const MeatCase: React.FC<MeatCaseProps> = React.memo(
  ({ position, length = 8.0 }) => {
    const trayCount = Math.floor(length * 2.2);

    // Batch all 34 foam trays, 34 meat cuts, and 34 scale price labels into 3 instanced draw calls
    const { trayInstances, meatCutInstances, labelInstances } = useMemo(() => {
      const trays: InstanceTransform[] = [];
      const cuts: InstanceTransform[] = [];
      const labels: InstanceTransform[] = [];

      const bedOriginX = 0.1;
      const bedOriginY = 0.96;
      const tiltZ = -0.14;
      const qTilt = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(0, 0, tiltZ)
      );
      const vLocal = new THREE.Vector3();

      for (let tIdx = 0; tIdx < trayCount; tIdx++) {
        const tz = -length / 2 + 0.32 + tIdx * ((length - 0.64) / trayCount);

        [-0.24, 0.18].forEach((tx, rowIdx) => {
          // Foam tray
          vLocal.set(tx, 0.03, tz).applyQuaternion(qTilt);
          trays.push({
            position: [bedOriginX + vLocal.x, bedOriginY + vLocal.y, vLocal.z],
            rotation: [0, 0, tiltZ],
            scale: [0.32, 0.025, 0.24],
            color: rowIdx === 0 ? '#111827' : '#fefce8',
          });

          // Marbled meat cut
          vLocal.set(tx, 0.054, tz).applyQuaternion(qTilt);
          const meatColor =
            (tIdx + rowIdx) % 3 === 0
              ? '#b91c1c'
              : (tIdx + rowIdx) % 3 === 1
                ? '#dc2626'
                : '#fda4af';
          cuts.push({
            position: [bedOriginX + vLocal.x, bedOriginY + vLocal.y, vLocal.z],
            rotation: [0, 0, tiltZ],
            scale: [0.26, 0.03, 0.18],
            color: meatColor,
          });

          // Price scale label
          vLocal.set(tx + 0.06, 0.072, tz + 0.04).applyQuaternion(qTilt);
          labels.push({
            position: [bedOriginX + vLocal.x, bedOriginY + vLocal.y, vLocal.z],
            rotation: [-Math.PI / 2, 0, tiltZ],
            scale: [0.08, 0.06, 1],
          });
        });
      }

      return {
        trayInstances: trays,
        meatCutInstances: cuts,
        labelInstances: labels,
      };
    }, [length, trayCount]);

    return (
      <group position={position} name="MeatCase">
        {/* Recessed Kickplate Plinth */}
        <mesh
          position={[0, 0.1, 0]}
          castShadow
          receiveShadow
          material={SHARED_MATERIALS.darkSlateMetal}
        >
          <boxGeometry args={[1.25, 0.2, length - 0.06]} />
        </mesh>

        {/* Brushed Stainless-Steel Chilled Lower Cabinet Body */}
        <mesh
          position={[0, 0.56, 0]}
          castShadow
          receiveShadow
          material={SHARED_MATERIALS.galvanizedSteel}
        >
          <boxGeometry args={[1.38, 0.72, length]} />
        </mesh>

        {/* Crimson Butcher Bumper Guard */}
        <mesh position={[0.71, 0.45, 0]}>
          <boxGeometry args={[0.04, 0.14, length + 0.02]} />
          <meshStandardMaterial color="#991b1b" roughness={0.35} />
        </mesh>

        {/* Stainless End Caps */}
        {[-length / 2 + 0.03, length / 2 - 0.03].map((ez, idx) => (
          <mesh
            key={`endcap-${idx}`}
            position={[0, 0.82, ez]}
            material={SHARED_MATERIALS.brushedAluminum}
          >
            <boxGeometry args={[1.4, 1.24, 0.06]} />
          </mesh>
        ))}

        {/* Rear Preparation Counter Ledge */}
        <mesh
          position={[-0.48, 0.96, 0]}
          material={SHARED_MATERIALS.shelfDeckSteel}
        >
          <boxGeometry args={[0.42, 0.08, length - 0.12]} />
        </mesh>

        {/* Slanted Chilled Display Bed */}
        <mesh
          position={[0.1, 0.96, 0]}
          rotation={[0, 0, -0.14]}
          material={SHARED_MATERIALS.darkSlateMetal}
        >
          <boxGeometry args={[0.88, 0.04, length - 0.14]} />
        </mesh>

        {/* Instanced Foam Trays, Meat Cuts & Price Labels */}
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.instancedProductMatte}
          instances={trayInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.instancedProductMatte}
          instances={meatCutInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_PLANE_GEO}
          material={SHARED_MATERIALS.cleanWhite}
          instances={labelInstances}
        />

        {/* Curved Glass Sneeze Guard */}
        <mesh position={[0.05, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry
            args={[0.64, 0.64, length - 0.12, 24, 1, true, 0.15, Math.PI * 0.42]}
          />
          <meshPhysicalMaterial
            color="#f0f9ff"
            transparent
            opacity={0.28}
            transmission={0.82}
            ior={1.5}
            roughness={0.04}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Top Chrome Rail & Integrated Butcher Case LED Strip */}
        <mesh position={[-0.1, 1.44, 0]} material={SHARED_MATERIALS.chrome}>
          <boxGeometry args={[0.24, 0.05, length]} />
        </mesh>
        <mesh position={[-0.05, 1.41, 0]}>
          <boxGeometry args={[0.08, 0.025, length - 0.2]} />
          <meshStandardMaterial
            color="#ffe4e6"
            emissive="#fda4af"
            emissiveIntensity={2.6}
          />
        </mesh>
      </group>
    );
  }
);

MeatCase.displayName = 'MeatCase';

// ============================================================================
// SUB-COMPONENT: HEAVY-DUTY GONDOLA SHELVING RUN (CENTRAL AISLES) — INSTANCED
// ============================================================================

const PRODUCT_PALETTES = [
  ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6'],
  ['#0284c7', '#ea580c', '#eab308', '#16a34a', '#dc2626'],
  ['#2563eb', '#db2777', '#d97706', '#059669', '#4f46e5'],
  ['#dc2626', '#ca8a04', '#0891b2', '#65a30d', '#9333ea'],
];

export const GondolaShelfRun: React.FC<GondolaShelfRunProps> = React.memo(
  ({ position, length = 21, aisleIndex }) => {
    const pegboardTexture = useMemo(() => getPegboardTexture(), []);
    const priceRailTexture = useMemo(() => getPriceRailTexture(), []);
    const priceRailMaterial = useMemo(
      () =>
        new THREE.MeshStandardMaterial({
          map: priceRailTexture,
          roughness: 0.3,
        }),
      [priceRailTexture]
    );

    const gondolaHeight = 2.2;
    const baseWidth = 1.25;
    const bayCount = 9;
    const bayLength = length / bayCount;
    const palette = PRODUCT_PALETTES[aisleIndex % PRODUCT_PALETTES.length];

    // Batch upright posts, shelf decks, price rails, product boxes, labels, and cans
    const {
      uprightPostInstances,
      shelfDeckInstances,
      priceRailInstances,
      productBoxInstances,
      productLabelInstances,
      productCanInstances,
    } = useMemo(() => {
      const uprights: InstanceTransform[] = [];
      const shelfDecks: InstanceTransform[] = [];
      const priceRails: InstanceTransform[] = [];
      const productBoxes: InstanceTransform[] = [];
      const productLabels: InstanceTransform[] = [];
      const productCans: InstanceTransform[] = [];

      const shelfHeights = [0.18, 0.62, 1.06, 1.5, 1.92];
      const itemZOffsets = [-0.82, -0.41, 0, 0.41, 0.82];

      // Slotted Metal Upright Posts
      for (let pIdx = 0; pIdx <= bayCount; pIdx++) {
        const pz = -length / 2 + pIdx * bayLength;
        uprights.push({
          position: [0, 1.1, pz],
          scale: [0.11, gondolaHeight, 0.045],
        });
      }

      // Dual-sided shelves, price rails, and merchandise
      [-1, 1].forEach((side) => {
        shelfHeights.forEach((sy, sIdx) => {
          const shelfDepth = sIdx === 0 ? 0.56 : 0.48;
          const shelfCenterX = side * (0.04 + shelfDepth / 2);
          const railX = side * (0.04 + shelfDepth + 0.008);

          shelfDecks.push({
            position: [shelfCenterX, sy, 0],
            scale: [shelfDepth, 0.03, length - 0.04],
          });

          priceRails.push({
            position: [railX, sy - 0.004, 0],
            rotation: [0, side === 1 ? Math.PI / 2 : -Math.PI / 2, 0],
            scale: [length - 0.06, 0.042, 1],
          });

          for (let bIdx = 0; bIdx < bayCount; bIdx++) {
            const bz = -length / 2 + (bIdx + 0.5) * bayLength;
            const prodColor =
              palette[(bIdx + sIdx + (side > 0 ? 1 : 0)) % palette.length];
            const isCylindrical = (sIdx + bIdx) % 3 === 1;

            itemZOffsets.forEach((offsetZ, mIdx) => {
              const itemH = 0.22 + ((bIdx + mIdx) % 3) * 0.04;
              const itemY = sy + 0.015 + itemH / 2;

              if (isCylindrical) {
                productCans.push({
                  position: [shelfCenterX + side * 0.05, itemY, bz + offsetZ],
                  scale: [0.1, itemH, 0.1],
                  color: prodColor,
                });
              } else {
                const boxX = shelfCenterX + side * 0.04;
                productBoxes.push({
                  position: [boxX, itemY, bz + offsetZ],
                  scale: [0.28, itemH, 0.32],
                  color: prodColor,
                });
                productLabels.push({
                  position: [boxX + side * 0.142, itemY + 0.02, bz + offsetZ],
                  scale: [0.005, itemH * 0.45, 0.26],
                });
              }
            });
          }
        });
      });

      // Front & Back Endcap Shelves & Promotional Cases
      [-length / 2 - 0.32, length / 2 + 0.32].forEach((ez, eIdx) => {
        const dir = eIdx === 0 ? -1 : 1;
        [0.2, 0.72, 1.24, 1.72].forEach((esy, esIdx) => {
          shelfDecks.push({
            position: [0, esy, ez + dir * 0.02],
            scale: [baseWidth - 0.06, 0.03, 0.5],
          });
          [-0.36, 0, 0.36].forEach((ex, exIdx) => {
            productBoxes.push({
              position: [ex, esy + 0.14, ez + dir * 0.02],
              scale: [0.28, 0.25, 0.36],
              color: palette[(esIdx + exIdx) % palette.length],
            });
          });
        });
      });

      return {
        uprightPostInstances: uprights,
        shelfDeckInstances: shelfDecks,
        priceRailInstances: priceRails,
        productBoxInstances: productBoxes,
        productLabelInstances: productLabels,
        productCanInstances: productCans,
      };
    }, [bayCount, bayLength, baseWidth, gondolaHeight, length, palette]);

    return (
      <group position={position} name={`GondolaShelfRun-${aisleIndex}`}>
        {/* Lower Base Kickplate Deck */}
        <mesh
          position={[0, 0.09, 0]}
          castShadow
          receiveShadow
          material={SHARED_MATERIALS.darkSlateMetal}
        >
          <boxGeometry args={[baseWidth, 0.18, length]} />
        </mesh>

        {/* Center Spine Structural Panel */}
        <mesh
          position={[0, 1.19, 0]}
          castShadow
          receiveShadow
          material={SHARED_MATERIALS.galvanizedSteel}
        >
          <boxGeometry args={[0.06, gondolaHeight - 0.18, length - 0.04]} />
        </mesh>

        {/* Perforated Pegboard Backing Panels */}
        <mesh position={[-0.035, 1.22, 0]} rotation={[0, -Math.PI / 2, 0]}>
          <planeGeometry args={[length - 0.1, gondolaHeight - 0.24]} />
          <meshStandardMaterial map={pegboardTexture} roughness={0.6} />
        </mesh>
        <mesh position={[0.035, 1.22, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[length - 0.1, gondolaHeight - 0.24]} />
          <meshStandardMaterial map={pegboardTexture} roughness={0.6} />
        </mesh>

        {/* Top Gondola Cap Trim */}
        <mesh
          position={[0, gondolaHeight, 0]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <boxGeometry args={[0.14, 0.05, length]} />
        </mesh>

        {/* Front & Back Promotional End-Cap Structures */}
        {[-length / 2 - 0.32, length / 2 + 0.32].map((ez, eIdx) => {
          const dir = eIdx === 0 ? -1 : 1;
          return (
            <group key={`endcap-frame-${eIdx}`} position={[0, 0, ez]}>
              <mesh
                position={[0, 0.09, 0]}
                material={SHARED_MATERIALS.darkSlateMetal}
              >
                <boxGeometry args={[baseWidth, 0.18, 0.6]} />
              </mesh>
              <mesh
                position={[0, 1.1, -dir * 0.26]}
                material={SHARED_MATERIALS.walmartBlue}
              >
                <boxGeometry args={[baseWidth, 2.2, 0.06]} />
              </mesh>
              <mesh
                position={[0, 2.05, 0]}
                material={SHARED_MATERIALS.walmartYellow}
              >
                <boxGeometry args={[baseWidth + 0.04, 0.28, 0.58]} />
              </mesh>
            </group>
          );
        })}

        {/* Instanced Gondola Hardware & Merchandise (6 Draw Calls for Entire 21m Aisle Run) */}
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.gondolaUprightSteel}
          instances={uprightPostInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.shelfDeckSteel}
          instances={shelfDeckInstances}
          castShadow
          receiveShadow
        />
        <InstancedStaticMesh
          geometry={UNIT_PLANE_GEO}
          material={priceRailMaterial}
          instances={priceRailInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.instancedProductMatte}
          instances={productBoxInstances}
          castShadow
        />
        <InstancedStaticMesh
          geometry={UNIT_BOX_GEO}
          material={SHARED_MATERIALS.brandLabelYellow}
          instances={productLabelInstances}
        />
        <InstancedStaticMesh
          geometry={UNIT_CYLINDER_GEO}
          material={SHARED_MATERIALS.instancedCanGloss}
          instances={productCanInstances}
          castShadow
        />
      </group>
    );
  }
);

GondolaShelfRun.displayName = 'GondolaShelfRun';

// ============================================================================
// SUB-COMPONENT: OVERHEAD DOUBLE-SIDED AISLE MARKER SIGN
// ============================================================================

export const OverheadAisleSign: React.FC<OverheadAisleSignProps> = React.memo(
  ({ position, aisleNumber, leftCategories, rightCategories }) => {
    const signTexture = useMemo(
      () => getAisleSignTexture(aisleNumber, leftCategories, rightCategories),
      [aisleNumber, leftCategories, rightCategories]
    );

    const signY = 3.85;
    const ceilingY = 6.2;
    const rodLength = ceilingY - signY;

    return (
      <group
        position={[position[0], 0, position[2]]}
        name={`OverheadAisleSign-${aisleNumber}`}
      >
        {[-1.15, 1.15].map((rx) => (
          <mesh
            key={`rod-${rx}`}
            position={[rx, signY + rodLength / 2, 0]}
            material={SHARED_MATERIALS.brushedAluminum}
          >
            <cylinderGeometry args={[0.015, 0.015, rodLength, 8]} />
          </mesh>
        ))}

        <group position={[0, signY, 0]}>
          <mesh castShadow>
            <boxGeometry args={[2.8, 1.25, 0.08]} />
            <meshStandardMaterial
              color="#003057"
              roughness={0.4}
              metalness={0.2}
            />
          </mesh>
          <mesh position={[0, 0, 0.045]}>
            <planeGeometry args={[2.72, 1.18]} />
            <meshStandardMaterial map={signTexture} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0, -0.045]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[2.72, 1.18]} />
            <meshStandardMaterial map={signTexture} roughness={0.25} />
          </mesh>
        </group>
      </group>
    );
  }
);

OverheadAisleSign.displayName = 'OverheadAisleSign';

// ============================================================================
// SUB-COMPONENT: CONVEYOR-BELT CHECKOUT COUNTER (Z = 16)
// ============================================================================

export const CheckoutLane: React.FC<CheckoutLaneProps> = React.memo(
  ({ position, laneNumber, enableAnimations = true }) => {
    const beltTexture = useMemo(() => getConveyorBeltTexture(), []);
    const posTexture = useMemo(
      () => getPOSMonitorTexture(`LANE 0${laneNumber} • OPEN`),
      [laneNumber]
    );

    useFrame((state) => {
      if (enableAnimations) {
        beltTexture.offset.y = -(state.clock.getElapsedTime() * 0.35) % 1;
      }
    });

    return (
      <group position={position} name={`CheckoutLane-${laneNumber}`}>
        {/* Main Counter Base Body */}
        <mesh
          position={[0, 0.45, 0]}
          castShadow
          receiveShadow
          material={SHARED_MATERIALS.mediumSlateMetal}
        >
          <boxGeometry args={[1.1, 0.9, 3.8]} />
        </mesh>

        {/* Walmart Blue Side Accent Panel */}
        <mesh
          position={[0.56, 0.45, 0]}
          material={SHARED_MATERIALS.walmartBlue}
        >
          <boxGeometry args={[0.02, 0.78, 3.6]} />
        </mesh>

        {/* Stainless Steel Counter Top Trim Rails */}
        {[-0.51, 0.51].map((rx) => (
          <mesh
            key={`rail-${rx}`}
            position={[rx, 0.92, 0]}
            material={SHARED_MATERIALS.galvanizedSteel}
          >
            <boxGeometry args={[0.08, 0.04, 3.82]} />
          </mesh>
        ))}

        {/* Moving Rubber Conveyor Belt Surface */}
        <mesh
          position={[0, 0.915, -0.7]}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[0.88, 1.9]} />
          <meshStandardMaterial
            map={beltTexture}
            roughness={0.75}
            metalness={0.1}
          />
        </mesh>

        {/* Flatbed Bi-Optic Barcode Scanner & Scale Glass */}
        <group position={[0, 0.91, 0.55]}>
          <mesh material={SHARED_MATERIALS.brushedAluminum}>
            <boxGeometry args={[0.72, 0.03, 0.48]} />
          </mesh>
          <mesh position={[0, 0.018, 0]}>
            <boxGeometry args={[0.52, 0.01, 0.36]} />
            <meshPhysicalMaterial
              color="#10b981"
              emissive="#059669"
              emissiveIntensity={0.7}
              roughness={0.05}
              metalness={0.1}
              transparent
              opacity={0.85}
            />
          </mesh>
          <mesh
            position={[-0.32, 0.14, 0]}
            material={SHARED_MATERIALS.darkSlateMetal}
          >
            <boxGeometry args={[0.12, 0.26, 0.38]} />
          </mesh>
          <mesh position={[0, 0.026, 0]}>
            <boxGeometry args={[0.46, 0.005, 0.012]} />
            <meshStandardMaterial
              color="#ef4444"
              emissive="#ef4444"
              emissiveIntensity={3}
            />
          </mesh>
        </group>

        {/* Touchscreen POS Monitor */}
        <group position={[-0.3, 0.92, 0.55]}>
          <mesh
            position={[0, 0.22, 0]}
            material={SHARED_MATERIALS.darkSlateMetal}
          >
            <cylinderGeometry args={[0.025, 0.025, 0.44, 12]} />
          </mesh>
          <group position={[0.12, 0.45, 0]} rotation={[0, Math.PI / 4, 0]}>
            <mesh material={SHARED_MATERIALS.darkSlateMetal}>
              <boxGeometry args={[0.48, 0.34, 0.04]} />
            </mesh>
            <mesh position={[0, 0, 0.022]}>
              <planeGeometry args={[0.44, 0.3]} />
              <meshStandardMaterial
                map={posTexture}
                emissive="#ffffff"
                emissiveIntensity={0.25}
              />
            </mesh>
          </group>
        </group>

        {/* Customer Credit Card Pin Pad Terminal */}
        <group position={[0.45, 1.08, 0.85]} rotation={[0.4, Math.PI / 2, 0]}>
          <mesh
            position={[0, -0.1, 0]}
            material={SHARED_MATERIALS.darkSlateMetal}
          >
            <cylinderGeometry args={[0.018, 0.022, 0.2, 10]} />
          </mesh>
          <mesh material={SHARED_MATERIALS.darkSlateMetal}>
            <boxGeometry args={[0.16, 0.04, 0.24]} />
          </mesh>
          <mesh position={[0, 0.022, -0.04]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.12, 0.09]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={1.1}
            />
          </mesh>
        </group>

        {/* Rear Bagging Carousel Area */}
        <group position={[0, 0.48, 1.38]}>
          <mesh castShadow material={SHARED_MATERIALS.mediumSlateMetal}>
            <cylinderGeometry args={[0.52, 0.56, 0.82, 20]} />
          </mesh>
          <mesh
            position={[0, 0.45, 0]}
            material={SHARED_MATERIALS.galvanizedSteel}
          >
            <cylinderGeometry args={[0.48, 0.48, 0.06, 20]} />
          </mesh>
        </group>

        {/* Tall Illuminated Lane Number Light Beacon Pole */}
        <group position={[-0.44, 0, -1.45]}>
          <mesh
            position={[0, 1.25, 0]}
            material={SHARED_MATERIALS.galvanizedSteel}
          >
            <cylinderGeometry args={[0.03, 0.03, 2.5, 12]} />
          </mesh>
          <mesh position={[0, 2.58, 0]}>
            <boxGeometry args={[0.32, 0.36, 0.32]} />
            <meshStandardMaterial
              color="#fef08a"
              emissive="#fde047"
              emissiveIntensity={2.2}
              roughness={0.15}
            />
          </mesh>
          <mesh position={[0, 2.36, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 16]} />
            <meshStandardMaterial
              color="#22c55e"
              emissive="#16a34a"
              emissiveIntensity={2.5}
            />
          </mesh>
        </group>

        {/* Impulse Candy / Magazine Rack */}
        <group position={[0.78, 0.42, -0.5]}>
          <mesh castShadow material={SHARED_MATERIALS.darkSlateMetal}>
            <boxGeometry args={[0.32, 0.84, 1.8]} />
          </mesh>
          {[0.25, 0.52, 0.78].map((cy, cIdx) => (
            <mesh key={`candy-row-${cIdx}`} position={[0.02, cy - 0.4, 0]}>
              <boxGeometry args={[0.26, 0.12, 1.68]} />
              <meshStandardMaterial
                color={
                  cIdx === 0 ? '#ef4444' : cIdx === 1 ? '#f59e0b' : '#3b82f6'
                }
                roughness={0.35}
              />
            </mesh>
          ))}
        </group>
      </group>
    );
  }
);

CheckoutLane.displayName = 'CheckoutLane';

// ============================================================================
// SUB-COMPONENT: 4-STATION SELF-CHECKOUT POD (Z = 16)
// ============================================================================

export const SelfCheckoutPod: React.FC<SelfCheckoutPodProps> = React.memo(
  ({ position }) => {
    const scoScreenTexture = useMemo(
      () => getPOSMonitorTexture('SELF CHECKOUT • SCAN & GO'),
      []
    );

    const stations: Array<{
      pos: [number, number, number];
      rotY: number;
      id: number;
    }> = useMemo(
      () => [
        { pos: [-1.85, 0, -1.35], rotY: Math.PI / 2, id: 1 },
        { pos: [-1.85, 0, 1.35], rotY: Math.PI / 2, id: 2 },
        { pos: [1.85, 0, -1.35], rotY: -Math.PI / 2, id: 3 },
        { pos: [1.85, 0, 1.35], rotY: -Math.PI / 2, id: 4 },
      ],
      []
    );

    return (
      <group position={position} name="SelfCheckoutPod">
        {/* Bullpen Floor Mat */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>
          <planeGeometry args={[4.8, 5.2]} />
          <meshStandardMaterial color="#e0f2fe" roughness={0.6} />
        </mesh>

        {/* Low Corral Rails */}
        {[-2.35, 2.35].map((rx) => (
          <group key={`corral-${rx}`} position={[rx, 0, 0]}>
            <mesh
              position={[0, 0.5, 0]}
              material={SHARED_MATERIALS.walmartBlue}
            >
              <boxGeometry args={[0.06, 1.0, 4.8]} />
            </mesh>
            <mesh
              position={[0, 1.02, 0]}
              material={SHARED_MATERIALS.galvanizedSteel}
            >
              <boxGeometry args={[0.08, 0.05, 4.84]} />
            </mesh>
          </group>
        ))}

        {/* 4 Individual Self-Checkout Kiosk Stations */}
        {stations.map((st) => (
          <group key={`sco-${st.id}`} position={st.pos} rotation={[0, st.rotY, 0]}>
            <mesh
              position={[0, 0.46, 0]}
              castShadow
              receiveShadow
              material={SHARED_MATERIALS.mediumSlateMetal}
            >
              <boxGeometry args={[0.68, 0.92, 0.62]} />
            </mesh>

            <mesh
              position={[0, 1.24, -0.08]}
              castShadow
              material={SHARED_MATERIALS.walmartBlue}
            >
              <boxGeometry args={[0.56, 0.68, 0.36]} />
            </mesh>

            <group position={[0, 1.32, 0.12]} rotation={[-0.22, 0, 0]}>
              <mesh material={SHARED_MATERIALS.darkSlateMetal}>
                <boxGeometry args={[0.5, 0.4, 0.04]} />
              </mesh>
              <mesh position={[0, 0, 0.022]}>
                <planeGeometry args={[0.46, 0.36]} />
                <meshStandardMaterial
                  map={scoScreenTexture}
                  emissive="#ffffff"
                  emissiveIntensity={0.3}
                />
              </mesh>
            </group>

            <mesh
              position={[0, 0.93, 0.12]}
              material={SHARED_MATERIALS.galvanizedSteel}
            >
              <boxGeometry args={[0.58, 0.03, 0.34]} />
            </mesh>
            <mesh position={[0, 0.95, 0.12]}>
              <boxGeometry args={[0.36, 0.01, 0.24]} />
              <meshStandardMaterial
                color="#10b981"
                emissive="#059669"
                emissiveIntensity={0.8}
              />
            </mesh>

            <group position={[0.64, 0, 0.05]}>
              <mesh
                position={[0, 0.36, 0]}
                castShadow
                material={SHARED_MATERIALS.mediumSlateMetal}
              >
                <boxGeometry args={[0.58, 0.72, 0.56]} />
              </mesh>
              <mesh
                position={[0, 0.74, 0]}
                material={SHARED_MATERIALS.shelfDeckSteel}
              >
                <boxGeometry args={[0.62, 0.04, 0.6]} />
              </mesh>
              <mesh
                position={[0, 0.92, -0.22]}
                material={SHARED_MATERIALS.chrome}
              >
                <boxGeometry args={[0.52, 0.32, 0.03]} />
              </mesh>
            </group>

            <mesh
              position={[-0.22, 1.7, -0.18]}
              material={SHARED_MATERIALS.galvanizedSteel}
            >
              <cylinderGeometry args={[0.02, 0.02, 1.5, 10]} />
            </mesh>
            <mesh position={[-0.22, 2.5, -0.18]}>
              <cylinderGeometry args={[0.06, 0.06, 0.24, 16]} />
              <meshStandardMaterial
                color="#22c55e"
                emissive="#22c55e"
                emissiveIntensity={2.8}
              />
            </mesh>
          </group>
        ))}
      </group>
    );
  }
);

SelfCheckoutPod.displayName = 'SelfCheckoutPod';

// ============================================================================
// MAIN EXPORT COMPONENT: STORE ENVIRONMENT
// ============================================================================

export const StoreEnvironment: React.FC<StoreEnvironmentProps> = ({
  enableAnimations = true,
  lightIntensityMultiplier = 1.0,
}) => {
  const aisleConfigs = useMemo(
    () => [
      {
        x: -7.5,
        number: '01',
        left: ['CEREAL & OATS', 'COFFEE & TEA'],
        right: ['PANCAKE & SYRUP', 'ARTISAN BAKERY'],
      },
      {
        x: -2.5,
        number: '02',
        left: ['PASTA & SAUCES', 'RICE & GRAINS'],
        right: ['CANNED SOUP', 'SPICES & OIL'],
      },
      {
        x: 2.5,
        number: '03',
        left: ['CHIPS & PRETZELS', 'COOKIES & NUTS'],
        right: ['CRAFT SODA', 'SPARKLING WATER'],
      },
      {
        x: 7.5,
        number: '04',
        left: ['PAPER TOWELS', 'LAUNDRY CARE'],
        right: ['PET SUPPLIES', 'HOME ESSENTIALS'],
      },
    ],
    []
  );

  const produceTableZPositions = useMemo(() => [-10.5, -4.0, 2.5, 9.0], []);
  const meatCaseZPositions = useMemo(() => [-12.5, -3.5, 5.5], []);

  return (
    <group name="WalmartSupercenterEnvironment">
      {/* 1. Store Architecture, Dark Charcoal Ceiling/Trusses, HVAC, LED Battens & Entrance */}
      <StoreArchitecture lightIntensityMultiplier={lightIntensityMultiplier} />

      {/* 2. Back Wall (Z = -25): 14-Unit Tall Refrigerated Dairy & Beverage Cooler Wall */}
      <CoolerWall position={[0, 0, -25]} unitCount={14} />

      {/* 3. Right Department (X = +15): 4 Slanted 2-Tier Farm Fresh Produce Tables */}
      {produceTableZPositions.map((pz, idx) => (
        <ProduceTable
          key={`produce-table-${idx}`}
          position={[15, 0, pz]}
          tableIndex={idx}
        />
      ))}

      {/* 4. Left Department (X = -18): Butcher Meat & Deli Chilled Showcases */}
      {meatCaseZPositions.map((mz, idx) => (
        <MeatCase
          key={`meat-case-${idx}`}
          position={[-18, 0, mz]}
          length={8.0}
        />
      ))}

      {/* 5. Central Aisles (X = -7.5, -2.5, +2.5, +7.5): 4 Gondola Shelving Runs & Overhead Signs */}
      {aisleConfigs.map((aisle, idx) => (
        <React.Fragment key={`aisle-group-${aisle.number}`}>
          <GondolaShelfRun
            position={[aisle.x, 0, -1.0]}
            length={21}
            aisleIndex={idx}
          />
          <OverheadAisleSign
            position={[aisle.x, 0, 10.2]}
            aisleNumber={aisle.number}
            leftCategories={aisle.left}
            rightCategories={aisle.right}
          />
          <OverheadAisleSign
            position={[aisle.x, 0, -12.2]}
            aisleNumber={aisle.number}
            leftCategories={aisle.left}
            rightCategories={aisle.right}
          />
        </React.Fragment>
      ))}

      {/* 6. Front Concourse (Z = 16): 2 Conveyor-Belt Checkout Counters + 4-Station Self-Checkout Pod */}
      <CheckoutLane
        position={[-7.5, 0, 16]}
        laneNumber={1}
        enableAnimations={enableAnimations}
      />
      <CheckoutLane
        position={[-2.5, 0, 16]}
        laneNumber={2}
        enableAnimations={enableAnimations}
      />
      <SelfCheckoutPod position={[5.5, 0, 16]} />
    </group>
  );
};

export default StoreEnvironment;
