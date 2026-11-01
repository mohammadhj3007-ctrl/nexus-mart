import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Product } from '../../types/store';
import { ClusterMesh } from './ProductClusters';
import { CocaColaBottle } from './CocaColaBottle';

class PreviewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('PREVIEW ERROR:', error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-rose-400 bg-red-950/80 z-20 text-xs font-mono">
          <p className="font-bold">3D Preview Error:</p>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const ProductPreviewCanvas: React.FC<{ product: Product }> = ({ product }) => {
  return (
    <div className="w-full h-64 md:h-72 relative rounded-2xl overflow-hidden bg-gradient-to-b from-slate-900/60 to-slate-950/80 border border-white/10">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[11px] font-mono text-cyan-400">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
        <span>3D INTERACTIVE INSPECT</span>
      </div>

      <PreviewErrorBoundary>
        <Canvas
          camera={{ position: [0, 0.16, 0.55], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={['#1e293b']} />
          <ambientLight intensity={2.2} />
          <directionalLight position={[0, 3, 4]} intensity={3.5} />
          <directionalLight position={[-3, 1, 2]} intensity={2.5} color="#ffffff" />
          <directionalLight position={[3, 1, 2]} intensity={2.5} color="#ffffff" />
          <pointLight position={[0, 0.5, 1]} intensity={2.5} color="#ffffff" />

          <Suspense fallback={null}>
            <RotatingProductWrapper product={product} />

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={3.0}
              target={[0, 0.16, 0]}
              maxPolarAngle={Math.PI / 1.7}
              minPolarAngle={Math.PI / 3}
            />
          </Suspense>
        </Canvas>
      </PreviewErrorBoundary>
    </div>
  );
};

const RotatingProductWrapper: React.FC<{ product: Product }> = ({ product }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.35;
    }
  });

  if (product.clusterType === 'soda-cans') {
    return (
      <group ref={groupRef} position={[0, -0.05, 0]}>
        <CocaColaBottle scale={1.5} />
      </group>
    );
  }

  return (
    <group ref={groupRef} position={[0, -0.05, 0]} scale={1.2}>
      <ClusterMesh
        clusterType={product.clusterType}
        primaryColor={product.primaryColor}
        secondaryColor={product.secondaryColor}
      />
    </group>
  );
};
