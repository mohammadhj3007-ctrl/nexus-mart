import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { CameraController } from './CameraController';
import { StoreEnvironment } from './StoreEnvironment';
import { ProductClusters } from './ProductClusters';

export const StoreCanvas: React.FC = () => {
  return (
    <div className="absolute inset-0 w-full h-full">
      <Canvas
        shadows
        camera={{ position: [0, 1.7, 19], fov: 65, near: 0.1, far: 90 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
      >
        <color attach="background" args={['#f8fafc']} />
        <Suspense fallback={null}>
          <CameraController />
          <StoreEnvironment />
          <ProductClusters />
        </Suspense>
      </Canvas>
    </div>
  );
};
