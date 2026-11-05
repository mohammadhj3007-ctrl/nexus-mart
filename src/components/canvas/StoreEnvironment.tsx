import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ThreeEvent, useFrame } from '@react-three/fiber';

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

const _worldPos = new THREE.Vector3();



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

// MEAT CASE PHOTOREALISM PROCEDURAL TEXTURES (CACHED IN SINGLETON)

// ============================================================================



function getGlassCondensationRoughnessMap(): THREE.CanvasTexture {

  return getOrCreateCachedTexture('meat-glass-condensation-roughness', () => {

    const canvas = document.createElement('canvas');

    canvas.width = 512;

    canvas.height = 512;

    const ctx = canvas.getContext('2d')!;



    // Base vertical roughness gradient: low roughness at top (clear viewing),

    // higher roughness along bottom/edges where chilled internal air meets outer glass

    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    grad.addColorStop(0.0, 'rgb(55, 55, 55)'); // Top rim frost band

    grad.addColorStop(0.14, 'rgb(14, 14, 14)'); // Crystal clear upper-mid canopy

    grad.addColorStop(0.65, 'rgb(20, 20, 20)'); // Clear lower-mid canopy

    grad.addColorStop(0.86, 'rgb(115, 115, 115)'); // Chilled mist transition zone

    grad.addColorStop(1.0, 'rgb(195, 195, 195)'); // Heavy frost/condensation at ice-bed base

    ctx.fillStyle = grad;

    ctx.fillRect(0, 0, 512, 512);



    // Deterministic micro-condensation beads & frost crystals in lower 35% and top 10%

    for (let i = 0; i < 1800; i++) {

      const seed = (i * 9301 + 49297) % 233280;

      const nx = seed / 233280;

      const seed2 = (seed * 9301 + 49297) % 233280;

      const ny = seed2 / 233280;



      const x = nx * 512;

      // Bias droplets toward bottom edge (y > 330) or top edge (y < 48)

      const y = i % 5 === 0 ? ny * 52 : 320 + ny * 192;

      const r = 0.8 + (i % 4) * 0.75;

      const alpha = y > 400 ? 0.55 : 0.28;



      ctx.fillStyle = `rgba(240, 248, 255, ${alpha})`;

      ctx.beginPath();

      ctx.arc(x, y, r, 0, Math.PI * 2);

      ctx.fill();

    }



    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;

    texture.wrapT = THREE.ClampToEdgeWrapping;

    texture.repeat.set(4, 1);

    return texture;

  });

}



function getGlassFrostTintMap(): THREE.CanvasTexture {

  return getOrCreateCachedTexture('meat-glass-frost-tint', () => {

    const canvas = document.createElement('canvas');

    canvas.width = 512;

    canvas.height = 512;

    const ctx = canvas.getContext('2d')!;



    const grad = ctx.createLinearGradient(0, 0, 0, 512);

    grad.addColorStop(0.0, '#dbeafe');

    grad.addColorStop(0.12, '#f0f9ff');

    grad.addColorStop(0.75, '#f0f9ff');

    grad.addColorStop(0.92, '#cfe8fc');

    grad.addColorStop(1.0, '#bae6fd');

    ctx.fillStyle = grad;

    ctx.fillRect(0, 0, 512, 512);



    // Subtle vertical condensation rivulets near bottom

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';

    ctx.lineWidth = 1.5;

    for (let i = 0; i < 64; i++) {

      const rx = ((i * 79) % 500) + 6;

      const ry = 370 + ((i * 37) % 90);

      ctx.beginPath();

      ctx.moveTo(rx, ry);

      ctx.lineTo(rx + ((i % 3) - 1) * 2, ry + 28 + (i % 20));

      ctx.stroke();

    }



    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;

    texture.wrapT = THREE.ClampToEdgeWrapping;

    texture.repeat.set(4, 1);

    return texture;

  });

}



function getCrushedIceTexture(): THREE.CanvasTexture {

  return getOrCreateCachedTexture('meat-crushed-ice-bed', () => {

    const canvas = document.createElement('canvas');

    canvas.width = 512;

    canvas.height = 512;

    const ctx = canvas.getContext('2d')!;



    ctx.fillStyle = '#e0f2fe';

    ctx.fillRect(0, 0, 512, 512);



    const palette = ['#f8fafc', '#ffffff', '#bae6fd', '#cbd5e1', '#e2e8f0'];

    for (let i = 0; i < 2400; i++) {

      const x = (i * 173) % 512;

      const y = (i * 311 + Math.floor(i / 40) * 19) % 512;

      const w = 4 + (i % 7);

      const h = 3 + ((i * 3) % 6);

      ctx.fillStyle = palette[i % palette.length];

      ctx.save();

      ctx.translate(x, y);

      ctx.rotate(((i % 12) * Math.PI) / 6);

      ctx.fillRect(-w / 2, -h / 2, w, h);

      ctx.restore();

    }



    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;

    texture.wrapT = THREE.RepeatWrapping;

    texture.repeat.set(10, 2);

    return texture;

  });

}



function getMeatMarblingTexture(): THREE.CanvasTexture {

  return getOrCreateCachedTexture('meat-marbling-surface', () => {

    const canvas = document.createElement('canvas');

    canvas.width = 256;

    canvas.height = 256;

    const ctx = canvas.getContext('2d')!;



    // Neutral white base so instanceColor controls the primary meat hue

    ctx.fillStyle = '#e5e7eb';

    ctx.fillRect(0, 0, 256, 256);



    // Subtle organic muscle grain & white intramuscular fat marbling striations

    for (let i = 0; i < 180; i++) {

      const x0 = (i * 53) % 256;

      const y0 = (i * 97) % 256;

      ctx.strokeStyle =

        i % 3 === 0 ? 'rgba(255, 250, 240, 0.72)' : 'rgba(160, 165, 175, 0.35)';

      ctx.lineWidth = i % 4 === 0 ? 2.4 : 1.2;

      ctx.beginPath();

      ctx.moveTo(x0, y0);

      ctx.quadraticCurveTo(

        x0 + 18 - (i % 11) * 3,

        y0 + 10 + (i % 7) * 2,

        x0 + 34 - (i % 9) * 4,

        y0 + 24

      );

      ctx.stroke();

    }



    const texture = new THREE.CanvasTexture(canvas);

    texture.wrapS = THREE.RepeatWrapping;

    texture.wrapT = THREE.RepeatWrapping;

    texture.repeat.set(2, 2);

    return texture;

  });

}



function getDixellThermometerTexture(): THREE.CanvasTexture {

  return getOrCreateCachedTexture('meat-dixell-34.2F', () => {

    const canvas = document.createElement('canvas');

    canvas.width = 256;

    canvas.height = 96;

    const ctx = canvas.getContext('2d')!;



    // Dark instrument bezel

    ctx.fillStyle = '#090d16';

    ctx.fillRect(0, 0, 256, 96);



    ctx.strokeStyle = '#334155';

    ctx.lineWidth = 4;

    ctx.strokeRect(3, 3, 250, 90);



    // Brand label

    ctx.fillStyle = '#94a3b8';

    ctx.font = 'bold 13px Arial, sans-serif';

    ctx.fillText('DIXELL XR06CX', 14, 22);



    // Green compressor & fan LEDs

    ctx.fillStyle = '#22c55e';

    ctx.beginPath();

    ctx.arc(216, 18, 5, 0, Math.PI * 2);

    ctx.fill();

    ctx.fillStyle = '#38bdf8';

    ctx.beginPath();

    ctx.arc(234, 18, 5, 0, Math.PI * 2);

    ctx.fill();



    // Glowing 7-segment style readout

    ctx.fillStyle = '#38bdf8';

    ctx.font = 'bold 50px monospace';

    ctx.fillText('34.2°F', 28, 74);



    return new THREE.CanvasTexture(canvas);

  });

}



function drawScaleScreenCanvas(

  ctx: CanvasRenderingContext2D,

  weightLb: string,

  unitPrice: string,

  totalPrice: string,

  cutLabel: string,

  tareActive: boolean

) {

  ctx.fillStyle = '#09131c';

  ctx.fillRect(0, 0, 512, 256);



  // Header strip

  ctx.fillStyle = '#0f2942';

  ctx.fillRect(0, 0, 512, 48);



  ctx.fillStyle = '#38bdf8';

  ctx.font = 'bold 22px monospace';

  ctx.fillText(`BUTCHER SCALE • ${cutLabel}`, 16, 31);



  // Tare badge

  ctx.fillStyle = tareActive ? '#22c55e' : '#334155';

  ctx.fillRect(408, 10, 88, 28);

  ctx.fillStyle = '#09131c';

  ctx.font = 'bold 17px monospace';

  ctx.fillText('TARE 0.00', 413, 29);



  // 3 Digital Readout Windows: WEIGHT | $/LB | TOTAL $

  const boxes = [

    { x: 16, w: 152, label: 'WEIGHT (LB)', val: weightLb, color: '#4ade80' },

    { x: 180, w: 144, label: 'UNIT $/LB', val: unitPrice, color: '#facc15' },

    { x: 336, w: 160, label: 'TOTAL ($)', val: totalPrice, color: '#38bdf8' },

  ];



  boxes.forEach((b) => {

    ctx.fillStyle = '#050a0f';

    ctx.fillRect(b.x, 68, b.w, 118);

    ctx.strokeStyle = '#1e293b';

    ctx.lineWidth = 2;

    ctx.strokeRect(b.x, 68, b.w, 118);



    ctx.fillStyle = '#94a3b8';

    ctx.font = 'bold 15px Arial, sans-serif';

    ctx.fillText(b.label, b.x + 10, 92);



    ctx.fillStyle = b.color;

    ctx.font = 'bold 40px monospace';

    ctx.fillText(b.val, b.x + 12, 156);

  });



  // Bottom status bar

  ctx.fillStyle = '#64748b';

  ctx.font = '16px monospace';

  ctx.fillText('MAX 30 LB  d=0.01 LB  •  USDA CERTIFIED LEGAL FOR TRADE', 16, 226);

}



// ============================================================================

// SHARED SINGLETON GEOMETRIES & MATERIALS (ZERO REDUNDANT GPU ALLOCATIONS)

// ============================================================================



const UNIT_BOX_GEO = new THREE.BoxGeometry(1, 1, 1);

const UNIT_CYLINDER_GEO = new THREE.CylinderGeometry(1, 1, 1, 14);

const UNIT_SPHERE_GEO = new THREE.SphereGeometry(1, 14, 12);

const UNIT_PLANE_GEO = new THREE.PlaneGeometry(1, 1);

const UNIT_TORUS_GEO = new THREE.TorusGeometry(1, 0.18, 8, 20);



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

    metalness: 0.78,

    roughness: 0.22,

  }),

  brushedStainless: new THREE.MeshStandardMaterial({

    color: '#d8dee6',

    metalness: 0.88,

    roughness: 0.18,

  }),

  chrome: new THREE.MeshStandardMaterial({

    color: '#f8fafc',

    metalness: 0.96,

    roughness: 0.08,

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

  siliconeGasketBlack: new THREE.MeshStandardMaterial({

    color: '#0f1419',

    roughness: 0.82,

    metalness: 0.05,

  }),

  matteBlackTray: new THREE.MeshStandardMaterial({

    color: '#111827',

    roughness: 0.38,

    metalness: 0.12,

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

  hdpePolyethyleneWhite: new THREE.MeshStandardMaterial({

    color: '#f8fafc',

    roughness: 0.28,

    metalness: 0.02,

  }),

  kraftButcherPaper: new THREE.MeshStandardMaterial({

    color: '#d6b386',

    roughness: 0.72,

    metalness: 0.02,

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

  instancedIceCrystal: new THREE.MeshPhysicalMaterial({

    color: '#e0f2fe',

    transparent: true,

    opacity: 0.68,

    transmission: 0.55,

    ior: 1.31,

    roughness: 0.15,

    clearcoat: 0.8,

  }),

  ivoryBone: new THREE.MeshStandardMaterial({

    color: '#fcfaf2',

    roughness: 0.32,

    metalness: 0.04,

  }),

  creamyFatRibbon: new THREE.MeshStandardMaterial({

    color: '#fef9e7',

    roughness: 0.22,

    metalness: 0.03,

  }),

  salmonSilverSkin: new THREE.MeshStandardMaterial({

    color: '#94a3b8',

    roughness: 0.24,

    metalness: 0.68,

  }),

  butcherTwineString: new THREE.MeshStandardMaterial({

    color: '#f5f5dc',

    roughness: 0.82,

    metalness: 0.0,

  }),

  parsleyChlorophyll: new THREE.MeshStandardMaterial({

    color: '#ffffff',

    roughness: 0.58,

    metalness: 0.02,

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

        trussChords.push({

          position: [0, 6.07, z],

          scale: [43.6, 0.12, 0.22],

        });

        trussChords.push({

          position: [0, 5.77, z],

          scale: [43.6, 0.12, 0.22],

        });

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

        <ambientLight

          intensity={0.68 * lightIntensityMultiplier}

          color="#f8fafc"

        />

        <hemisphereLight

          args={['#ffffff', '#1e293b', 0.85 * lightIntensityMultiplier]}

          position={[0, 6.2, 0]}

        />



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



        <directionalLight

          position={[-12, 14, -12]}

          intensity={0.75 * lightIntensityMultiplier}

          color="#e0f2fe"

        />



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



        <mesh

          rotation={[Math.PI / 2, 0, 0]}

          position={[0, 6.2, 0]}

          material={SHARED_MATERIALS.darkCharcoalCeiling}

        >

          <planeGeometry args={[44, 54]} />

        </mesh>



        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.darkCharcoalTruss}

          instances={trussChordInstances}

        />



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



        {/* Front Entrance Wall (Z = +26.5) */}

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



          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, -2.2]}>

            <planeGeometry args={[11, 3.4]} />

            <meshStandardMaterial color="#334155" roughness={0.9} />

          </mesh>



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



    const {

      darkWoodInstances,

      wickerInstances,

      produceSphereInstances,

    } = useMemo(() => {

      const darkWood: InstanceTransform[] = [];

      const wicker: InstanceTransform[] = [];

      const spheres: InstanceTransform[] = [];



      [-1.35, 1.35].forEach((lx) => {

        [-0.75, 0.75].forEach((lz) => {

          darkWood.push({

            position: [lx, 0.42, lz],

            scale: [0.12, 0.84, 0.12],

          });

        });

      });



      [-1.2, 1.2].forEach((rx) => {

        darkWood.push({

          position: [rx, 1.16, 0],

          scale: [0.08, 0.48, 0.08],

        });

      });



      darkWood.push({

        position: [0, 1.95, 0],

        scale: [1.35, 0.42, 0.04],

      });



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



        <mesh

          position={[0, 0.25, 0]}

          receiveShadow

          material={SHARED_MATERIALS.woodMedium}

        >

          <boxGeometry args={[tableWidth - 0.2, 0.06, tableDepth - 0.2]} />

        </mesh>



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



        <mesh

          position={[0, 1.38, 0]}

          castShadow

          material={SHARED_MATERIALS.woodLight}

        >

          <boxGeometry args={[tableWidth - 0.1, 0.08, 0.56]} />

        </mesh>



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



        <mesh position={[0, 1.95, 0.022]}>

          <planeGeometry args={[1.3, 0.38]} />

          <meshStandardMaterial map={signTexture} roughness={0.5} />

        </mesh>

        <mesh position={[0, 1.95, -0.022]} rotation={[0, Math.PI, 0]}>

          <planeGeometry args={[1.3, 0.38]} />

          <meshStandardMaterial map={signTexture} roughness={0.5} />

        </mesh>

      </group>

    );

  }

);



ProduceTable.displayName = 'ProduceTable';



// ============================================================================

// SUB-COMPONENT: MASTERCLASS BUTCHER MEAT & DELI CHILLED SHOWCASE (X = -18)

// ============================================================================



const MEAT_ZONE_METADATA = [

  {

    id: 0,

    name: 'USDA PRIME BONE-IN RIBEYE',

    unitPrice: '18.98',

    baseWeight: 2.48,

  },

  {

    id: 1,

    name: 'DRY-AGED T-BONE PORTERHOUSE',

    unitPrice: '16.48',

    baseWeight: 1.94,

  },

  {

    id: 2,

    name: 'FRESH ATLANTIC SALMON FILLET',

    unitPrice: '12.98',

    baseWeight: 1.62,

  },

  {

    id: 3,

    name: 'ARTISAN SWEET ITALIAN SAUSAGE',

    unitPrice: '6.98',

    baseWeight: 2.15,

  },

  {

    id: 4,

    name: '90/10 GROUND ANGUS SIRLOIN',

    unitPrice: '7.48',

    baseWeight: 2.86,

  },

  {

    id: 5,

    name: 'HERB-CRUSTED TIED PRIME ROAST',

    unitPrice: '21.98',

    baseWeight: 4.12,

  },

];



export const MeatCase: React.FC<MeatCaseProps> = React.memo(

  ({ position, length = 8.0 }) => {

    const groupRef = useRef<THREE.Group>(null);

    const inspectionLightRef = useRef<THREE.PointLight>(null);

    const [hoveredZone, setHoveredZone] = useState<number | null>(null);

    const activeZoneRef = useRef<number>(0);

    const lastScaleTickRef = useRef<number>(0);



    // Cached singleton textures

    const condensationRoughnessMap = useMemo(

      () => getGlassCondensationRoughnessMap(),

      []

    );

    const frostTintMap = useMemo(() => getGlassFrostTintMap(), []);

    const crushedIceMap = useMemo(() => getCrushedIceTexture(), []);

    const meatMarblingMap = useMemo(() => getMeatMarblingTexture(), []);

    const dixellTexture = useMemo(() => getDixellThermometerTexture(), []);



    // Persistent digital scale CanvasTexture (cached per case Z-coordinate)

    const { scaleTexture, scaleCtx } = useMemo(() => {

      const cacheKey = `butcher-digital-scale:${position[2]}`;

      const existing = TEXTURE_CACHE.get(cacheKey);

      if (existing && existing.image instanceof HTMLCanvasElement) {

        return {

          scaleTexture: existing,

          scaleCtx: existing.image.getContext('2d')!,

        };

      }

      const canvas = document.createElement('canvas');

      canvas.width = 512;

      canvas.height = 256;

      const ctx = canvas.getContext('2d')!;

      drawScaleScreenCanvas(

        ctx,

        '2.48',

        '18.98',

        '47.07',

        'USDA PRIME BONE-IN RIBEYE',

        true

      );

      const tex = new THREE.CanvasTexture(canvas);

      tex.anisotropy = 4;

      tex.needsUpdate = true;

      TEXTURE_CACHE.set(cacheKey, tex);

      return { scaleTexture: tex, scaleCtx: ctx };

    }, [position]);



    // Ultra-realistic chilled tempered sneeze-guard glass with condensation roughness & frost gradient

    const ultraGlassMaterial = useMemo(

      () =>

        new THREE.MeshPhysicalMaterial({

          map: frostTintMap,

          roughnessMap: condensationRoughnessMap,

          color: '#f0f9ff',

          transparent: true,

          opacity: 0.34,

          transmission: 0.88,

          ior: 1.52,

          thickness: 0.03,

          roughness: 0.38,

          metalness: 0.04,

          clearcoat: 1.0,

          clearcoatRoughness: 0.04,

          reflectivity: 0.95,

          attenuationColor: new THREE.Color('#dbeafe'),

          attenuationDistance: 1.6,

          side: THREE.DoubleSide,

        }),

      [condensationRoughnessMap, frostTintMap]

    );



    const marbledMeatMaterial = useMemo(

      () =>

        new THREE.MeshStandardMaterial({

          map: meatMarblingMap,

          bumpMap: meatMarblingMap,

          bumpScale: 0.008,

          color: '#ffffff',

          roughness: 0.24,

          metalness: 0.04,

        }),

      [meatMarblingMap]

    );



    const crushedIceBedMaterial = useMemo(

      () =>

        new THREE.MeshStandardMaterial({

          map: crushedIceMap,

          bumpMap: crushedIceMap,

          bumpScale: 0.015,

          color: '#e8f6ff',

          roughness: 0.22,

          metalness: 0.08,

        }),

      [crushedIceMap]

    );



    // Compute all instanced geometry transforms for the 6 meat varieties, hardware, and hanging charcuterie

    const {

      trayInstances,

      iceNuggetInstances,

      parsleyInstances,

      marbledCutInstances,

      fatRibbonInstances,

      boneInstances,

      salmonSkinInstances,

      sausageLinkInstances,

      sausageKnotInstances,

      roastTwineInstances,

      herbFlakeInstances,

      priceLabelInstances,

      chromeClampInstances,

      gasStrutCylinderInstances,

      gasStrutPistonInstances,

      gasketStripInstances,

      sHookInstances,

      hangingSalamiInstances,

      salamiCasingTipInstances,

      garlicBulbInstances,

      zoneZCenters,

    } = useMemo(() => {

      const trays: InstanceTransform[] = [];

      const iceNuggets: InstanceTransform[] = [];

      const parsley: InstanceTransform[] = [];

      const marbledCuts: InstanceTransform[] = [];

      const fatRibbons: InstanceTransform[] = [];

      const bones: InstanceTransform[] = [];

      const salmonSkins: InstanceTransform[] = [];

      const sausageLinks: InstanceTransform[] = [];

      const sausageKnots: InstanceTransform[] = [];

      const roastTwines: InstanceTransform[] = [];

      const herbFlakes: InstanceTransform[] = [];

      const priceLabels: InstanceTransform[] = [];

      const chromeClamps: InstanceTransform[] = [];

      const strutCylinders: InstanceTransform[] = [];

      const strutPistons: InstanceTransform[] = [];

      const gaskets: InstanceTransform[] = [];

      const sHooks: InstanceTransform[] = [];

      const hangingSalamis: InstanceTransform[] = [];

      const salamiTips: InstanceTransform[] = [];

      const garlicBulbs: InstanceTransform[] = [];

      const zCenters: number[] = [];



      const bedOriginX = 0.1;

      const bedOriginY = 0.96;

      const tiltZ = -0.14;

      const qTilt = new THREE.Quaternion().setFromEuler(

        new THREE.Euler(0, 0, tiltZ)

      );

      const vLocal = new THREE.Vector3();



      const toBedWorld = (lx: number, ly: number, lz: number): [number, number, number] => {

        vLocal.set(lx, ly, lz).applyQuaternion(qTilt);

        return [bedOriginX + vLocal.x, bedOriginY + vLocal.y, vLocal.z];

      };



      // 18 columns across the 8.0m case divided into 6 culinary zones (3 columns per zone)

      const colCount = 18;

      const usableLen = length - 0.68;

      const colStep = usableLen / colCount;



      for (let zIdx = 0; zIdx < 6; zIdx++) {

        const zoneCenterZ =

          -usableLen / 2 + (zIdx * 3 + 1.5) * colStep;

        zCenters.push(zoneCenterZ);

      }



      // Crushed ice nuggets along front & rear of ice bed

      for (let i = 0; i < 84; i++) {

        const iz = -usableLen / 2 + (i / 83) * usableLen;

        const ix = i % 2 === 0 ? 0.39 - (i % 3) * 0.02 : -0.39 + (i % 3) * 0.02;

        iceNuggets.push({

          position: toBedWorld(ix, 0.028, iz),

          rotation: [(i % 5) * 0.3, (i % 7) * 0.4, tiltZ],

          scale: [0.028, 0.018, 0.032],

        });

      }



      // Fresh curly parsley dividers between the 6 zones

      const parsleyColors = ['#15803d', '#16a34a', '#22c55e', '#14532d'];

      for (let divIdx = 1; divIdx < 6; divIdx++) {

        const divZ = -usableLen / 2 + divIdx * 3 * colStep - colStep * 0.5;

        for (let p = 0; p < 14; p++) {

          const px = -0.36 + (p / 13) * 0.72;

          parsley.push({

            position: toBedWorld(px, 0.036 + (p % 2) * 0.008, divZ),

            scale: [0.034, 0.024, 0.034],

            color: parsleyColors[p % parsleyColors.length],

          });

        }

      }



      // Populate the 18 tray columns (2 tiers per column: upper rear & lower front)

      for (let cIdx = 0; cIdx < colCount; cIdx++) {

        const zoneIdx = Math.floor(cIdx / 3);

        const cz = -usableLen / 2 + (cIdx + 0.5) * colStep;



        [-0.21, 0.19].forEach((tx, tierIdx) => {

          // Black fluted butcher display platter

          trays.push({

            position: toBedWorld(tx, 0.028, cz),

            rotation: [0, 0, tiltZ],

            scale: [0.34, 0.022, 0.34],

          });



          // Corner price pin tag on platter

          priceLabels.push({

            position: toBedWorld(tx + 0.12, 0.058, cz + 0.11),

            rotation: [-Math.PI / 2, 0, tiltZ - 0.2],

            scale: [0.075, 0.052, 1],

          });



          // Populate zone-specific meat cuts on each platter

          if (zoneIdx === 0) {

            // ZONE 0: Bone-In Prime Ribeyes with fat ribbons & curved ivory rib bone

            [-0.07, 0.07].forEach((oz, sIdx) => {

              const yaw = sIdx === 0 ? 0.08 : -0.06;

              marbledCuts.push({

                position: toBedWorld(tx, 0.054, cz + oz),

                rotation: [0, yaw, tiltZ],

                scale: [0.22, 0.032, 0.125],

                color: '#991b1b',

              });

              // Creamy deckle fat ribbon cap

              fatRibbons.push({

                position: toBedWorld(tx + 0.06, 0.056, cz + oz + 0.048),

                rotation: [0, yaw + 0.15, tiltZ],

                scale: [0.16, 0.033, 0.028],

              });

              // Ribeye spinalis fat eye

              fatRibbons.push({

                position: toBedWorld(tx - 0.02, 0.071, cz + oz),

                rotation: [0, yaw, tiltZ],

                scale: [0.045, 0.004, 0.032],

              });

              // Protruding curved ivory rib bone

              bones.push({

                position: toBedWorld(tx - 0.095, 0.055, cz + oz - 0.03),

                rotation: [0, yaw - 0.35, tiltZ],

                scale: [0.11, 0.024, 0.024],

              });

            });

          } else if (zoneIdx === 1) {

            // ZONE 1: Dry-Aged T-Bone Porterhouse Steaks

            [-0.07, 0.07].forEach((oz) => {

              // Strip loin lobe + tenderloin lobe

              marbledCuts.push({

                position: toBedWorld(tx - 0.02, 0.054, cz + oz - 0.022),

                rotation: [0, 0.05, tiltZ],

                scale: [0.21, 0.032, 0.075],

                color: '#7f1d1d',

              });

              marbledCuts.push({

                position: toBedWorld(tx + 0.02, 0.054, cz + oz + 0.032),

                rotation: [0, -0.05, tiltZ],

                scale: [0.15, 0.032, 0.055],

                color: '#991b1b',

              });

              // T-shaped bone divider (stem + crossbar)

              bones.push({

                position: toBedWorld(tx, 0.057, cz + oz + 0.008),

                rotation: [0, 0, tiltZ],

                scale: [0.23, 0.034, 0.014],

              });

              bones.push({

                position: toBedWorld(tx - 0.1, 0.057, cz + oz + 0.008),

                rotation: [0, Math.PI / 2, tiltZ],

                scale: [0.095, 0.034, 0.016],

              });

              // Outer fat trim

              fatRibbons.push({

                position: toBedWorld(tx + 0.09, 0.055, cz + oz - 0.02),

                rotation: [0, 0, tiltZ],

                scale: [0.026, 0.032, 0.08],

              });

            });

          } else if (zoneIdx === 2) {

            // ZONE 2: Fresh Atlantic Salmon Fillets with silver skin & white fat striations

            [-0.07, 0.07].forEach((oz) => {

              // Silver-blue skin base layer

              salmonSkins.push({

                position: toBedWorld(tx, 0.044, cz + oz),

                rotation: [0, 0, tiltZ],

                scale: [0.25, 0.008, 0.115],

              });

              // Coral-orange salmon flesh

              marbledCuts.push({

                position: toBedWorld(tx, 0.058, cz + oz),

                rotation: [0, 0, tiltZ],

                scale: [0.245, 0.024, 0.11],

                color: '#f97316',

              });

              // White omega-3 fat striations across fillet

              [-0.07, -0.02, 0.03, 0.08].forEach((sx) => {

                fatRibbons.push({

                  position: toBedWorld(tx + sx, 0.071, cz + oz),

                  rotation: [0, 0.35, tiltZ],

                  scale: [0.008, 0.003, 0.105],

                });

              });

            });

          } else if (zoneIdx === 3) {

            // ZONE 3: Artisan Sausage Links with casing pinch knots

            [-0.09, 0, 0.09].forEach((oz, lIdx) => {

              [-0.07, 0.07].forEach((ox) => {

                const sausageColor =

                  (tierIdx + lIdx) % 2 === 0 ? '#9a3412' : '#b91c1c';

                sausageLinks.push({

                  position: toBedWorld(tx + ox, 0.054, cz + oz),

                  rotation: [0, 0, tiltZ + Math.PI / 2],

                  scale: [0.022, 0.115, 0.022],

                  color: sausageColor,

                });

              });

              // Pinched casing twist knots between links & ends

              [-0.13, 0, 0.13].forEach((kx) => {

                sausageKnots.push({

                  position: toBedWorld(tx + kx, 0.054, cz + oz),

                  scale: [0.011, 0.011, 0.011],

                });

              });

            });

          } else if (zoneIdx === 4) {

            // ZONE 4: 90/10 Ground Angus Sirloin Textured Loaves

            [-0.065, 0.065].forEach((oz) => {

              // Main ground sirloin mound + vermicelli surface ridges

              marbledCuts.push({

                position: toBedWorld(tx, 0.058, cz + oz),

                rotation: [0, 0, tiltZ],

                scale: [0.23, 0.038, 0.11],

                color: '#dc2626',

              });

              [-0.035, 0, 0.035].forEach((rz) => {

                sausageLinks.push({

                  position: toBedWorld(tx, 0.078, cz + oz + rz),

                  rotation: [0, 0, tiltZ + Math.PI / 2],

                  scale: [0.012, 0.21, 0.012],

                  color: '#ef4444',

                });

              });

            });

          } else {

            // ZONE 5: Herb-Crusted Tied Prime Beef Roasts with butcher twine & rosemary/pepper flakes

            sausageLinks.push({

              position: toBedWorld(tx, 0.076, cz),

              rotation: [Math.PI / 2, 0, tiltZ],

              scale: [0.062, 0.26, 0.062],

              color: '#7f1d1d',

            });

            // Top fat cap on roast

            fatRibbons.push({

              position: toBedWorld(tx, 0.134, cz),

              rotation: [0, 0, tiltZ],

              scale: [0.085, 0.012, 0.25],

            });

            // 4 White butcher twine loops tied around roast

            [-0.09, -0.03, 0.03, 0.09].forEach((tz) => {

              roastTwines.push({

                position: toBedWorld(tx, 0.076, cz + tz),

                rotation: [0, 0, tiltZ],

                scale: [0.064, 0.064, 0.04],

              });

            });

            // Cracked black pepper, garlic & rosemary herb crust flakes

            const herbPalette = ['#365314', '#1e293b', '#fde047', '#14532d'];

            for (let h = 0; h < 12; h++) {

              const hz = -0.1 + (h / 11) * 0.2;

              const hx = ((h % 3) - 1) * 0.025;

              herbFlakes.push({

                position: toBedWorld(tx + hx, 0.142, cz + hz),

                rotation: [0, (h * 0.7) % Math.PI, tiltZ],

                scale: [0.014, 0.005, 0.008],

                color: herbPalette[h % herbPalette.length],

              });

            }

          }

        });

      }



      // Hardware: Gas-Strut Hinges, Chrome Glass Clamps & Silicone Gasket Joints

      const clampZPositions = [

        -length / 2 + 0.12,

        -length * 0.3,

        -length * 0.1,

        length * 0.1,

        length * 0.3,

        length / 2 - 0.12,

      ];



      clampZPositions.forEach((kz) => {

        // Top canopy chrome D-clamp

        chromeClamps.push({

          position: [0.02, 1.445, kz],

          scale: [0.07, 0.045, 0.055],

        });

        // Lower front glass shoe chrome clamp

        chromeClamps.push({

          position: [0.66, 0.935, kz],

          scale: [0.055, 0.05, 0.055],

        });

        // Angled internal hydraulic gas-strut cylinder + chrome piston rod

        strutCylinders.push({

          position: [0.12, 1.18, kz],

          rotation: [0, 0, -0.58],

          scale: [0.016, 0.26, 0.016],

        });

        strutPistons.push({

          position: [0.22, 1.31, kz],

          rotation: [0, 0, -0.58],

          scale: [0.009, 0.22, 0.009],

        });

      });



      // Side tempered glass clamps (2 per end)

      [-length / 2 + 0.03, length / 2 - 0.03].forEach((ez) => {

        chromeClamps.push({

          position: [0.35, 1.15, ez],

          scale: [0.05, 0.045, 0.045],

        });

        chromeClamps.push({

          position: [-0.08, 1.32, ez],

          scale: [0.05, 0.045, 0.045],

        });

      });



      // EPDM Black Silicone Gasket Joints where glass meets stainless steel

      // Front bottom glass shoe gasket

      gaskets.push({

        position: [0.665, 0.915, 0],

        scale: [0.035, 0.025, length - 0.08],

      });

      // Top rear glass-to-canopy gasket

      gaskets.push({

        position: [0.02, 1.435, 0],

        scale: [0.035, 0.022, length - 0.08],

      });

      // Left & right side glass bottom gaskets

      [-length / 2 + 0.03, length / 2 - 0.03].forEach((ez) => {

        gaskets.push({

          position: [0.18, 0.93, ez],

          scale: [0.96, 0.022, 0.03],

        });

      });



      // Rear Overhead Charcuterie Rail: Hanging Cured Salami Pairs & Braided Garlic Clusters

      const hangerCount = 10;

      for (let hIdx = 0; hIdx < hangerCount; hIdx++) {

        const hz = -length / 2 + 0.65 + (hIdx / (hangerCount - 1)) * (length - 1.3);



        // Chrome S-Hook on rail (X = -0.52, Y = 1.66)

        sHooks.push({

          position: [-0.52, 1.65, hz],

          scale: [0.008, 0.07, 0.008],

        });



        if (hIdx % 3 !== 2) {

          // Hanging Cured Salami / Chorizo Pair (angled V-hang)

          [-0.032, 0.032].forEach((dz, pIdx) => {

            const tilt = pIdx === 0 ? 0.08 : -0.08;

            hangingSalamis.push({

              position: [-0.52, 1.47, hz + dz],

              rotation: [tilt, 0, 0],

              scale: [0.034, 0.28, 0.034],

              color: hIdx % 2 === 0 ? '#7f1d1d' : '#9a3412',

            });

            // Tied casing top & bottom knots

            salamiTips.push({

              position: [-0.52, 1.615, hz + dz * 0.5],

              scale: [0.014, 0.018, 0.014],

            });

            salamiTips.push({

              position: [-0.52, 1.32, hz + dz * 1.3],

              scale: [0.014, 0.018, 0.014],

            });

          });

        } else {

          // Braided Garlic Cluster (vertical stem + 8 plump white/gold garlic bulbs)

          salamiTips.push({

            position: [-0.52, 1.49, hz],

            scale: [0.016, 0.26, 0.016],

          });

          for (let g = 0; g < 8; g++) {

            const gy = 1.36 + g * 0.032;

            const angle = g * 1.1;

            garlicBulbs.push({

              position: [

                -0.52 + Math.cos(angle) * 0.026,

                gy,

                hz + Math.sin(angle) * 0.026,

              ],

              scale: [0.026, 0.022, 0.026],

              color: g % 2 === 0 ? '#fefce8' : '#fef08a',

            });

          }

        }

      }



      return {

        trayInstances: trays,

        iceNuggetInstances: iceNuggets,

        parsleyInstances: parsley,

        marbledCutInstances: marbledCuts,

        fatRibbonInstances: fatRibbons,

        boneInstances: bones,

        salmonSkinInstances: salmonSkins,

        sausageLinkInstances: sausageLinks,

        sausageKnotInstances: sausageKnots,

        roastTwineInstances: roastTwines,

        herbFlakeInstances: herbFlakes,

        priceLabelInstances: priceLabels,

        chromeClampInstances: chromeClamps,

        gasStrutCylinderInstances: strutCylinders,

        gasStrutPistonInstances: strutPistons,

        gasketStripInstances: gaskets,

        sHookInstances: sHooks,

        hangingSalamiInstances: hangingSalamis,

        salamiCasingTipInstances: salamiTips,

        garlicBulbInstances: garlicBulbs,

        zoneZCenters: zCenters,

      };

    }, [length]);



    // Interactive inspection spotlight & natural digital pole scale load-cell micro-fluctuation

    useFrame((state, delta) => {

      const group = groupRef.current;

      const light = inspectionLightRef.current;

      if (!group || !light) return;



      // Determine active zone via pointer hover OR camera proximity (< 4.2m from case front)

      let targetZone = hoveredZone;

      let isInspecting = hoveredZone !== null;



      if (targetZone === null) {

        group.getWorldPosition(_worldPos);

        const cam = state.camera.position;

        const dx = Math.abs(cam.x - (_worldPos.x + 0.8));

        const dz = cam.z - _worldPos.z;



        if (dx < 4.2 && Math.abs(dz) < length / 2 + 0.5) {

          isInspecting = true;

          let closestIdx = 0;

          let minDist = Infinity;

          for (let i = 0; i < zoneZCenters.length; i++) {

            const d = Math.abs(dz - zoneZCenters[i]);

            if (d < minDist) {

              minDist = d;

              closestIdx = i;

            }

          }

          targetZone = closestIdx;

        }

      }



      const resolvedZone = targetZone ?? activeZoneRef.current;

      activeZoneRef.current = resolvedZone;



      // Smoothly glide the warm inspection spotlight to the active meat zone

      const targetZ = zoneZCenters[resolvedZone] ?? 0;

      light.position.z = THREE.MathUtils.lerp(

        light.position.z,

        targetZ,

        Math.min(1, delta * 7)

      );

      const targetIntensity = isInspecting ? 3.2 : 1.1;

      light.intensity = THREE.MathUtils.lerp(

        light.intensity,

        targetIntensity,

        Math.min(1, delta * 6)

      );



      // Update the digital pole scale readout at a realistic ~3.5 Hz load-cell sampling rate

      const elapsed = state.clock.getElapsedTime();

      if (elapsed - lastScaleTickRef.current > 0.28) {

        lastScaleTickRef.current = elapsed;

        const meta = MEAT_ZONE_METADATA[resolvedZone % MEAT_ZONE_METADATA.length];

        // Subtle natural load-cell strain-gauge micro-jitter (+/- 0.01 lb)

        const harmonic =

          Math.sin(elapsed * 4.7 + position[2]) +

          Math.cos(elapsed * 7.3) * 0.5;

        const jitter =

          harmonic > 0.65 ? 0.01 : harmonic < -0.65 ? -0.01 : 0.0;

        const currentWeight = Math.max(0.1, meta.baseWeight + jitter);

        const total = currentWeight * parseFloat(meta.unitPrice);

        const tareBlink = Math.floor(elapsed * 2) % 6 !== 0;



        drawScaleScreenCanvas(

          scaleCtx,

          currentWeight.toFixed(2),

          meta.unitPrice,

          total.toFixed(2),

          meta.name,

          tareBlink

        );

        scaleTexture.needsUpdate = true;

      }

    });



    const handleZoneOver = (idx: number) => (e: ThreeEvent<PointerEvent>) => {

      e.stopPropagation();

      setHoveredZone(idx);

    };



    const handleZoneOut = () => {

      setHoveredZone(null);

    };



    return (

      <group ref={groupRef} position={position} name="MeatCase">

        {/* ==================== 1. CABINET BASE, DIXELL CONTROLLER & BUMPER ==================== */}

        {/* Recessed Kickplate Plinth (Y = 0 to 0.2m) */}

        <mesh

          position={[0, 0.1, 0]}

          castShadow

          receiveShadow

          material={SHARED_MATERIALS.darkSlateMetal}

        >

          <boxGeometry args={[1.26, 0.2, length - 0.06]} />

        </mesh>



        {/* Dixell Digital Temperature Controller (34.2°F) Mounted on Lower Front Bevel */}

        <group position={[0.64, 0.11, -length / 2 + 0.55]}>

          <mesh material={SHARED_MATERIALS.siliconeGasketBlack}>

            <boxGeometry args={[0.03, 0.09, 0.22]} />

          </mesh>

          <mesh position={[0.017, 0, 0]} rotation={[0, Math.PI / 2, 0]}>

            <planeGeometry args={[0.2, 0.075]} />

            <meshStandardMaterial

              map={dixellTexture}

              emissive="#38bdf8"

              emissiveIntensity={0.45}

              roughness={0.2}

            />

          </mesh>

        </group>



        {/* Brushed Stainless-Steel Chilled Lower Cabinet Body (Y = 0.2 to 0.92m) */}

        <mesh

          position={[0, 0.56, 0]}

          castShadow

          receiveShadow

          material={SHARED_MATERIALS.brushedStainless}

        >

          <boxGeometry args={[1.38, 0.72, length]} />

        </mesh>



        {/* Front Shopping-Cart Impact Bumper Guard + Chrome Rub Rail */}

        <mesh position={[0.71, 0.45, 0]}>

          <boxGeometry args={[0.045, 0.14, length + 0.02]} />

          <meshStandardMaterial color="#991b1b" roughness={0.32} />

        </mesh>

        <mesh position={[0.734, 0.45, 0]} material={SHARED_MATERIALS.chrome}>

          <boxGeometry args={[0.01, 0.035, length + 0.025]} />

        </mesh>



        {/* Brushed Stainless End-Cap Bulkheads */}

        {[-length / 2 + 0.03, length / 2 - 0.03].map((ez, idx) => (

          <group key={`endcap-${idx}`} position={[0, 0, ez]}>

            <mesh

              position={[0, 0.56, 0]}

              material={SHARED_MATERIALS.brushedStainless}

            >

              <boxGeometry args={[1.42, 0.74, 0.06]} />

            </mesh>

            {/* Side Tempered Glass Partition Wing */}

            <mesh position={[0.16, 1.18, 0]} material={ultraGlassMaterial}>

              <boxGeometry args={[0.96, 0.5, 0.02]} />

            </mesh>

          </group>

        ))}



        {/* ==================== 2. REAR BUTCHER WORKSTATION, CUTTING BOARD, SCALE & PAPER ROLL ==================== */}

        {/* Rear Stainless Preparation Counter Ledge */}

        <mesh

          position={[-0.48, 0.96, 0]}

          material={SHARED_MATERIALS.brushedStainless}

        >

          <boxGeometry args={[0.44, 0.08, length - 0.12]} />

        </mesh>



        {/* White High-Density Polyethylene (HDPE) Butcher Cutting Board */}

        <mesh

          position={[-0.48, 1.015, -0.6]}

          receiveShadow

          material={SHARED_MATERIALS.hdpePolyethyleneWhite}

        >

          <boxGeometry args={[0.36, 0.03, 2.4]} />

        </mesh>



        {/* Butcher Kraft Paper Roll Dispenser with Tear Blade */}

        <group position={[-0.5, 1.06, -2.4]}>

          {/* Side mounting brackets */}

          {[-0.42, 0.42].map((bz) => (

            <mesh

              key={`paper-brk-${bz}`}

              position={[0, 0.06, bz]}

              material={SHARED_MATERIALS.chrome}

            >

              <boxGeometry args={[0.18, 0.22, 0.02]} />

            </mesh>

          ))}

          {/* Kraft butcher paper cylinder roll */}

          <mesh

            position={[0, 0.06, 0]}

            rotation={[Math.PI / 2, 0, 0]}

            material={SHARED_MATERIALS.kraftButcherPaper}

          >

            <cylinderGeometry args={[0.085, 0.085, 0.8, 16]} />

          </mesh>

          {/* Serrated spring tear bar */}

          <mesh position={[0.09, 0.11, 0]} material={SHARED_MATERIALS.chrome}>

            <boxGeometry args={[0.02, 0.025, 0.84]} />

          </mesh>

        </group>



        {/* Commercial Digital Pole Scale with Live Micro-Fluctuating Dual Readout */}

        <group position={[-0.46, 1.0, 1.55]}>

          {/* Scale Base Housing */}

          <mesh

            position={[0, 0.04, 0]}

            material={SHARED_MATERIALS.darkSlateMetal}

          >

            <boxGeometry args={[0.34, 0.08, 0.38]} />

          </mesh>

          {/* Brushed Stainless Weighing Platter */}

          <mesh

            position={[0.02, 0.09, 0]}

            material={SHARED_MATERIALS.chrome}

          >

            <boxGeometry args={[0.3, 0.02, 0.34]} />

          </mesh>

          {/* Vertical Chrome Pole Column */}

          <mesh

            position={[-0.14, 0.34, 0]}

            material={SHARED_MATERIALS.chrome}

          >

            <cylinderGeometry args={[0.022, 0.022, 0.52, 12]} />

          </mesh>

          {/* Dual-Sided Digital Display Head (Facing Customer +X and Butcher -X) */}

          <group position={[-0.14, 0.62, 0]}>

            <mesh material={SHARED_MATERIALS.darkSlateMetal}>

              <boxGeometry args={[0.09, 0.19, 0.38]} />

            </mesh>

            {/* Customer-Facing LCD Screen (+X) */}

            <mesh position={[0.047, 0, 0]} rotation={[0, Math.PI / 2, 0]}>

              <planeGeometry args={[0.35, 0.165]} />

              <meshStandardMaterial

                map={scaleTexture}

                emissive="#ffffff"

                emissiveIntensity={0.42}

                roughness={0.18}

              />

            </mesh>

            {/* Butcher-Facing LCD Screen (-X) */}

            <mesh position={[-0.047, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>

              <planeGeometry args={[0.35, 0.165]} />

              <meshStandardMaterial

                map={scaleTexture}

                emissive="#ffffff"

                emissiveIntensity={0.42}

                roughness={0.18}

              />

            </mesh>

          </group>

        </group>



        {/* Rear Overhead Stainless Charcuterie Rail for Hanging Salamis & Garlic Braids */}

        <group position={[-0.52, 0, 0]}>

          {[-length / 2 + 0.45, 0, length / 2 - 0.45].map((sz) => (

            <mesh

              key={`rail-post-${sz}`}

              position={[0, 1.34, sz]}

              material={SHARED_MATERIALS.chrome}

            >

              <cylinderGeometry args={[0.018, 0.018, 0.72, 10]} />

            </mesh>

          ))}

          <mesh

            position={[0, 1.69, 0]}

            rotation={[Math.PI / 2, 0, 0]}

            material={SHARED_MATERIALS.chrome}

          >

            <cylinderGeometry args={[0.018, 0.018, length - 0.7, 12]} />

          </mesh>

        </group>



        {/* ==================== 3. CRUSHED ICE BED & SLANTED CHILLED WELL ==================== */}

        <group position={[0.1, 0.96, 0]} rotation={[0, 0, -0.14]}>

          {/* Stainless Chilled Well Pan */}

          <mesh material={SHARED_MATERIALS.darkSlateMetal}>

            <boxGeometry args={[0.88, 0.03, length - 0.14]} />

          </mesh>

          {/* Textured Crushed Ice Bed Surface */}

          <mesh

            position={[0, 0.02, 0]}

            receiveShadow

            material={crushedIceBedMaterial}

          >

            <boxGeometry args={[0.84, 0.018, length - 0.18]} />

          </mesh>

        </group>



        {/* ==================== 4. INSTANCED MEAT VARIETIES, TRAYS, HARDWARE & CHARCUTERIE ==================== */}

        {/* Black Fluted Display Platters */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.matteBlackTray}

          instances={trayInstances}

          receiveShadow

        />

        {/* Translucent Crushed Ice Nuggets */}

        <InstancedStaticMesh

          geometry={UNIT_SPHERE_GEO}

          material={SHARED_MATERIALS.instancedIceCrystal}

          instances={iceNuggetInstances}

        />

        {/* Curly Fresh Parsley Dividers */}

        <InstancedStaticMesh

          geometry={UNIT_SPHERE_GEO}

          material={SHARED_MATERIALS.parsleyChlorophyll}

          instances={parsleyInstances}

        />

        {/* Marbled Ribeyes, T-Bones, Salmon Fillets & Ground Sirloin Loaves */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={marbledMeatMaterial}

          instances={marbledCutInstances}

          castShadow

        />

        {/* Creamy Fat Cap Ribbons & Salmon Omega-3 Striations */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.creamyFatRibbon}

          instances={fatRibbonInstances}

        />

        {/* Ivory Ribeye & T-Bone Vertebra Bones */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.ivoryBone}

          instances={boneInstances}

        />

        {/* Metallic Silver-Blue Salmon Skin Backing */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.salmonSilverSkin}

          instances={salmonSkinInstances}

        />

        {/* Artisan Sausage Links & Tied Beef Roasts */}

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={marbledMeatMaterial}

          instances={sausageLinkInstances}

          castShadow

        />

        {/* Sausage Casing Pinch Twist Knots */}

        <InstancedStaticMesh

          geometry={UNIT_SPHERE_GEO}

          material={SHARED_MATERIALS.creamyFatRibbon}

          instances={sausageKnotInstances}

        />

        {/* White Butcher Twine Rings Around Roasts */}

        <InstancedStaticMesh

          geometry={UNIT_TORUS_GEO}

          material={SHARED_MATERIALS.butcherTwineString}

          instances={roastTwineInstances}

        />

        {/* Rosemary, Garlic & Cracked Black Pepper Herb Flakes */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.instancedProductMatte}

          instances={herbFlakeInstances}

        />

        {/* Platter Corner Price Labels */}

        <InstancedStaticMesh

          geometry={UNIT_PLANE_GEO}

          material={SHARED_MATERIALS.cleanWhite}

          instances={priceLabelInstances}

        />

        {/* Chrome Glass Clamps */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.chrome}

          instances={chromeClampInstances}

        />

        {/* Internal Gas-Strut Hinge Cylinders & Chrome Piston Rods */}

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={SHARED_MATERIALS.darkSlateMetal}

          instances={gasStrutCylinderInstances}

        />

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={SHARED_MATERIALS.chrome}

          instances={gasStrutPistonInstances}

        />

        {/* Black EPDM Silicone Gasket Seals */}

        <InstancedStaticMesh

          geometry={UNIT_BOX_GEO}

          material={SHARED_MATERIALS.siliconeGasketBlack}

          instances={gasketStripInstances}

        />

        {/* Hanging Charcuterie: S-Hooks, Cured Salamis, Tied Tips & Braided Garlic Bulbs */}

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={SHARED_MATERIALS.chrome}

          instances={sHookInstances}

        />

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={marbledMeatMaterial}

          instances={hangingSalamiInstances}

          castShadow

        />

        <InstancedStaticMesh

          geometry={UNIT_CYLINDER_GEO}

          material={SHARED_MATERIALS.butcherTwineString}

          instances={salamiCasingTipInstances}

        />

        <InstancedStaticMesh

          geometry={UNIT_SPHERE_GEO}

          material={SHARED_MATERIALS.instancedProductMatte}

          instances={garlicBulbInstances}

        />



        {/* ==================== 5. CURVED SNEEZE-GUARD GLASS CANOPY & SERVICE DECK ==================== */}

        {/* Curved Tempered Glass Canopy with Condensation/Frost Roughness Gradient */}

        <mesh

          position={[0.05, 0.92, 0]}

          rotation={[Math.PI / 2, 0, 0]}

          material={ultraGlassMaterial}

        >

          <cylinderGeometry

            args={[

              0.64,

              0.64,

              length - 0.08,

              32,

              1,

              true,

              0.14,

              Math.PI * 0.43,

            ]}

          />

        </mesh>



        {/* Flat Tempered Glass Top Service Deck + Chrome Mullion Rail */}

        <mesh position={[-0.14, 1.445, 0]} material={ultraGlassMaterial}>

          <boxGeometry args={[0.32, 0.018, length - 0.06]} />

        </mesh>

        <mesh position={[-0.29, 1.445, 0]} material={SHARED_MATERIALS.chrome}>

          <boxGeometry args={[0.04, 0.035, length]} />

        </mesh>



        {/* Integrated Warm Butcher LED Luminaires under Top Canopy */}

        <mesh position={[-0.04, 1.425, 0]}>

          <boxGeometry args={[0.07, 0.022, length - 0.16]} />

          <meshStandardMaterial

            color="#ffe4e6"

            emissive="#fda4af"

            emissiveIntensity={2.8}

          />

        </mesh>



        {/* ==================== 6. INTERACTIVE INSPECTION ZONES & DYNAMIC SPOTLIGHTING ==================== */}

        {/* Dynamic Warm Inspection Light that Glides to Hovered or Nearest Meat Cut Zone */}

        <pointLight

          ref={inspectionLightRef}

          position={[0.22, 1.34, 0]}

          intensity={1.2}

          distance={3.6}

          decay={1.8}

          color="#fecdd3"

        />



        {/* 6 Invisible Interactive Bounding Boxes for Pointer Inspection & Zone Highlighting */}

        {zoneZCenters.map((zz, zIdx) => {

          const isHovered = hoveredZone === zIdx;

          return (

            <group key={`inspect-zone-${zIdx}`} position={[0.15, 1.05, zz]}>

              <mesh

                onPointerOver={handleZoneOver(zIdx)}

                onPointerOut={handleZoneOut}

              >

                <boxGeometry args={[0.88, 0.36, (length - 0.68) / 6]} />

                <meshBasicMaterial

                  color="#fda4af"

                  transparent

                  opacity={isHovered ? 0.12 : 0.0}

                  depthWrite={false}

                />

              </mesh>

            </group>

          );

        })}

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



      for (let pIdx = 0; pIdx <= bayCount; pIdx++) {

        const pz = -length / 2 + pIdx * bayLength;

        uprights.push({

          position: [0, 1.1, pz],

          scale: [0.11, gondolaHeight, 0.045],

        });

      }



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

        <mesh

          position={[0, 0.09, 0]}

          castShadow

          receiveShadow

          material={SHARED_MATERIALS.darkSlateMetal}

        >

          <boxGeometry args={[baseWidth, 0.18, length]} />

        </mesh>



        <mesh

          position={[0, 1.19, 0]}

          castShadow

          receiveShadow

          material={SHARED_MATERIALS.galvanizedSteel}

        >

          <boxGeometry args={[0.06, gondolaHeight - 0.18, length - 0.04]} />

        </mesh>



        <mesh position={[-0.035, 1.22, 0]} rotation={[0, -Math.PI / 2, 0]}>

          <planeGeometry args={[length - 0.1, gondolaHeight - 0.24]} />

          <meshStandardMaterial map={pegboardTexture} roughness={0.6} />

        </mesh>

        <mesh position={[0.035, 1.22, 0]} rotation={[0, Math.PI / 2, 0]}>

          <planeGeometry args={[length - 0.1, gondolaHeight - 0.24]} />

          <meshStandardMaterial map={pegboardTexture} roughness={0.6} />

        </mesh>



        <mesh

          position={[0, gondolaHeight, 0]}

          material={SHARED_MATERIALS.walmartBlue}

        >

          <boxGeometry args={[0.14, 0.05, length]} />

        </mesh>



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

        <mesh

          position={[0, 0.45, 0]}

          castShadow

          receiveShadow

          material={SHARED_MATERIALS.mediumSlateMetal}

        >

          <boxGeometry args={[1.1, 0.9, 3.8]} />

        </mesh>



        <mesh

          position={[0.56, 0.45, 0]}

          material={SHARED_MATERIALS.walmartBlue}

        >

          <boxGeometry args={[0.02, 0.78, 3.6]} />

        </mesh>



        {[-0.51, 0.51].map((rx) => (

          <mesh

            key={`rail-${rx}`}

            position={[rx, 0.92, 0]}

            material={SHARED_MATERIALS.galvanizedSteel}

          >

            <boxGeometry args={[0.08, 0.04, 3.82]} />

          </mesh>

        ))}



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

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]}>

          <planeGeometry args={[4.8, 5.2]} />

          <meshStandardMaterial color="#e0f2fe" roughness={0.6} />

        </mesh>



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



        {stations.map((st) => (

          <group

            key={`sco-${st.id}`}

            position={st.pos}

            rotation={[0, st.rotY, 0]}

          >

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



      {/* 4. Left Department (X = -18): Masterclass Butcher Meat & Deli Chilled Showcases */}

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
