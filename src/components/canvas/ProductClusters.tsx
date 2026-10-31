import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { PRODUCTS } from '../../data/products';
import { Product } from '../../types/store';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { Sparkles, Eye, ShoppingBag } from 'lucide-react';
import { CocaColaBottleCluster } from './CocaColaBottle';

export const ProductClusters: React.FC = () => {
  return (
    <group>
      {PRODUCTS.map((product) => (
        <ProductBatch key={product.id} product={product} />
      ))}
    </group>
  );
};

const ProductBatch: React.FC<{ product: Product }> = ({ product }) => {
  const playerPos = useStore((s) => s.playerPos);
  const setActiveProduct = useStore((s) => s.setActiveProduct);
  const addToCart = useStore((s) => s.addToCart);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  const [isHovered, setIsHovered] = useState(false);

  // Compute distance from player camera to product
  const dist = Math.sqrt(
    Math.pow(playerPos[0] - product.position[0], 2) +
      Math.pow(playerPos[1] - product.position[1], 2) +
      Math.pow(playerPos[2] - product.position[2], 2)
  );

  // Distance culling: visible only within 5.0 units
  const isWithinRange = dist <= 5.0;
  // Fade factor from 5.0 down to 4.2
  const opacity = Math.min(Math.max((5.0 - dist) / 0.8, 0), 1);

  // Hotspot position placed neatly along shelf edge facing walkway
  const hotspotOffset: [number, number, number] = [
    product.position[0] < 0 ? 0.38 : -0.38,
    0.15,
    0,
  ];

  const handlePointerEnter = () => {
    if (!isWithinRange) return;
    setIsHovered(true);
    setIsHoveringInteractive(true);
    sounds.playHover();
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setIsHoveringInteractive(false);
  };

  const handleOpenModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playClick();
    setActiveProduct(product);
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    sounds.playAddToCart();
    addToCart(product, 1);
  };

  return (
    <group position={product.position}>
      {/* 3D Procedural Mesh Cluster */}
      <ClusterMesh clusterType={product.clusterType} primaryColor={product.primaryColor} secondaryColor={product.secondaryColor} />

      {/* Distance-Culled Interactive 3D Hotspot */}
      {isWithinRange && (
        <group position={hotspotOffset}>
          <Html center distanceFactor={8} position={[0, 0, 0]}>
            <div
              style={{
                opacity: opacity,
                pointerEvents: opacity > 0.3 ? 'auto' : 'none',
                transition: 'opacity 0.25s ease-out',
              }}
              className="relative flex flex-col items-center select-none"
              onMouseEnter={handlePointerEnter}
              onMouseLeave={handlePointerLeave}
            >
              {/* Floating Glassmorphism Quick Card on Hover */}
              {isHovered && (
                <div
                  className="absolute bottom-10 w-64 p-3.5 rounded-2xl glass-panel text-white shadow-2xl border border-white/20 animate-float transition-all duration-300 z-50 pointer-events-auto"
                  style={{ backdropFilter: 'blur(20px)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span
                      className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded-full"
                      style={{
                        backgroundColor: `${product.primaryColor}25`,
                        color: product.primaryColor,
                        border: `1px solid ${product.primaryColor}60`,
                      }}
                    >
                      {product.category}
                    </span>
                    <span className="text-emerald-400 font-bold text-sm">
                      ${product.price.toFixed(2)}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold font-heading text-slate-100 line-clamp-1">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 leading-snug">
                    {product.shortSpec}
                  </p>

                  <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/10">
                    <button
                      onClick={handleOpenModal}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[11px] font-medium py-1.5 px-2 rounded-lg transition-colors border border-white/10"
                    >
                      <Eye className="w-3 h-3 text-cyan-400" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={handleQuickAdd}
                      className="flex items-center justify-center gap-1 bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-bold text-[11px] py-1.5 px-3 rounded-lg transition-colors shadow-[0_0_10px_rgba(56,189,248,0.4)]"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Glowing Beacon / Circular Hotspot */}
              <button
                onClick={handleOpenModal}
                className={`relative flex items-center justify-center rounded-full transition-transform duration-300 ${
                  isHovered ? 'scale-125' : 'scale-100'
                }`}
                style={{
                  width: '32px',
                  height: '32px',
                }}
              >
                {/* Outer animated pulse wave */}
                <span
                  className="absolute inset-0 rounded-full animate-ping opacity-60"
                  style={{ backgroundColor: product.primaryColor }}
                />
                {/* Middle glass ring */}
                <span
                  className="absolute inset-0 rounded-full border-2 border-white/70 shadow-lg"
                  style={{
                    backgroundColor: `${product.primaryColor}88`,
                    boxShadow: `0 0 15px ${product.primaryColor}`,
                  }}
                />
                {/* Center glowing core dot */}
                <span className="relative w-2.5 h-2.5 rounded-full bg-white shadow-sm flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-slate-900" />
                </span>
              </button>
            </div>
          </Html>
        </group>
      )}
    </group>
  );
};

// Procedural Mesh Generator for the 12 Product Categories
export const ClusterMesh: React.FC<{
  clusterType: Product['clusterType'];
  primaryColor: string;
  secondaryColor: string;
}> = ({ clusterType, primaryColor, secondaryColor }) => {
  switch (clusterType) {
    // --- 1. HYPER-REALISTIC COCA-COLA 1.5L BOTTLE CLUSTER ---
    case 'soda-cans':
      return <CocaColaBottleCluster />;

    // --- 2. ENERGY DRINK CANS (4-pack tall slim) ---
    case 'energy-cans':
      return (
        <group>
          {[-0.14, 0.14].map((z, zi) =>
            [-0.12, 0.12].map((x, xi) => (
              <group key={`ecan-${zi}-${xi}`} position={[x, 0.04, z]}>
                {/* Matte Black Bottom */}
                <mesh position={[0, -0.18, 0]}>
                  <cylinderGeometry args={[0.065, 0.06, 0.03, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
                </mesh>
                {/* Slim Body */}
                <mesh position={[0, 0, 0]} castShadow>
                  <cylinderGeometry args={[0.065, 0.065, 0.34, 20]} />
                  <meshStandardMaterial color={primaryColor} metalness={0.85} roughness={0.2} />
                </mesh>
                {/* Glowing Contrast Stripe */}
                <mesh position={[0, 0.05, 0]}>
                  <cylinderGeometry args={[0.066, 0.066, 0.04, 20]} />
                  <meshStandardMaterial color={secondaryColor} emissive={secondaryColor} emissiveIntensity={0.6} />
                </mesh>
                {/* Top Cap */}
                <mesh position={[0, 0.18, 0]}>
                  <cylinderGeometry args={[0.058, 0.065, 0.02, 16]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.9} roughness={0.1} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );

    // --- 3. GLASS WATER BOTTLES (4-pack) ---
    case 'water-bottles':
      return (
        <group>
          {[-0.16, 0.16].map((z, zi) =>
            [-0.12, 0.12].map((x, xi) => (
              <group key={`bottle-${zi}-${xi}`} position={[x, 0.05, z]}>
                {/* Glass Cylindrical Body */}
                <mesh position={[0, -0.04, 0]} castShadow>
                  <cylinderGeometry args={[0.07, 0.07, 0.28, 20]} />
                  <meshPhysicalMaterial
                    color={primaryColor}
                    transparent
                    opacity={0.65}
                    roughness={0.05}
                    transmission={0.8}
                    thickness={0.2}
                  />
                </mesh>
                {/* Tapered Glass Neck */}
                <mesh position={[0, 0.13, 0]}>
                  <cylinderGeometry args={[0.035, 0.07, 0.08, 16]} />
                  <meshPhysicalMaterial
                    color={primaryColor}
                    transparent
                    opacity={0.65}
                    roughness={0.05}
                    transmission={0.8}
                  />
                </mesh>
                {/* Silver Metal Screw Cap */}
                <mesh position={[0, 0.19, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.04, 16]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
                </mesh>
              </group>
            ))
          )}
        </group>
      );

    // --- 4. CEREAL BOXES (Row of 3) ---
    case 'cereal-boxes':
      return (
        <group>
          {[-0.22, 0, 0.22].map((z, idx) => (
            <group key={`cereal-${idx}`} position={[0, 0.04, z]}>
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.38, 0.26]} />
                <meshStandardMaterial color={primaryColor} roughness={0.4} metalness={0.05} />
              </mesh>
              {/* Face Graphic Panel */}
              <mesh position={[0.082, 0, 0]}>
                <planeGeometry args={[0.22, 0.32]} />
                <meshStandardMaterial color={secondaryColor} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 5. CHOCOLATE BARS (4 stacked upright in display tray) ---
    case 'chocolate-bars':
      return (
        <group>
          {/* Display Cardboard Caddy */}
          <mesh position={[0, -0.08, 0]}>
            <boxGeometry args={[0.22, 0.08, 0.44]} />
            <meshStandardMaterial color="#3e2723" roughness={0.8} />
          </mesh>
          {/* 4 Standing Chocolate Bars */}
          {[-0.15, -0.05, 0.05, 0.15].map((z, idx) => (
            <group key={`choc-${idx}`} position={[0, 0.05, z]} rotation={[0.12, 0, 0]}>
              <mesh castShadow>
                <boxGeometry args={[0.14, 0.26, 0.03]} />
                <meshStandardMaterial color={primaryColor} roughness={0.6} />
              </mesh>
              {/* Golden Foil Band */}
              <mesh position={[0, 0.02, 0.016]}>
                <planeGeometry args={[0.13, 0.08]} />
                <meshStandardMaterial color={secondaryColor} metalness={0.85} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 6. OLIVE OIL TINS (2 large square tins) ---
    case 'olive-oil':
      return (
        <group>
          {[-0.15, 0.15].map((z, idx) => (
            <group key={`oil-${idx}`} position={[0, 0.05, z]}>
              <mesh castShadow>
                <boxGeometry args={[0.2, 0.36, 0.22]} />
                <meshStandardMaterial color={primaryColor} metalness={0.8} roughness={0.3} />
              </mesh>
              {/* Brass Pour Spout */}
              <mesh position={[0.05, 0.2, 0.05]}>
                <cylinderGeometry args={[0.025, 0.03, 0.05, 12]} />
                <meshStandardMaterial color={secondaryColor} metalness={0.9} roughness={0.2} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 7. HEADPHONES DISPLAY STAND ---
    case 'headphones':
      return (
        <group position={[0, 0.05, 0]}>
          {/* Solid Acrylic Stand Base */}
          <mesh position={[0, -0.14, 0]}>
            <cylinderGeometry args={[0.16, 0.18, 0.04, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* Stand Upright Arch */}
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.025, 0.025, 0.38, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.1} />
          </mesh>
          {/* Headband Curved Top */}
          <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.13, 0.02, 12, 24, Math.PI]} />
            <meshStandardMaterial color="#1e293b" roughness={0.5} />
          </mesh>
          {/* Left Earcup */}
          <group position={[0, 0.1, -0.14]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 20]} />
              <meshStandardMaterial color={secondaryColor} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.028]}>
              <ringGeometry args={[0.03, 0.055, 20]} />
              <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={1.5} />
            </mesh>
          </group>
          {/* Right Earcup */}
          <group position={[0, 0.1, 0.14]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.06, 0.06, 0.05, 20]} />
              <meshStandardMaterial color={secondaryColor} metalness={0.7} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, 0.028]}>
              <ringGeometry args={[0.03, 0.055, 20]} />
              <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={1.5} />
            </mesh>
          </group>
        </group>
      );

    // --- 8. SMARTWATCH ON SLANTED PEDESTAL ---
    case 'smartwatch':
      return (
        <group position={[0, 0.02, 0]}>
          {/* Slanted Presentation Stand */}
          <mesh position={[0, -0.06, 0]} rotation={[-0.35, 0, 0]}>
            <boxGeometry args={[0.26, 0.2, 0.28]} />
            <meshPhysicalMaterial
              color="#0f172a"
              roughness={0.1}
              metalness={0.6}
            />
          </mesh>
          {/* Watch Body Casing */}
          <group position={[0, 0.06, 0]} rotation={[-0.35, 0, 0]}>
            <mesh castShadow>
              <boxGeometry args={[0.15, 0.18, 0.035]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.15} />
            </mesh>
            {/* Glowing AMOLED Display */}
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.13, 0.15]} />
              <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={1.8} />
            </mesh>
            {/* Watch Straps */}
            <mesh position={[0, 0.14, -0.02]}>
              <boxGeometry args={[0.1, 0.12, 0.02]} />
              <meshStandardMaterial color="#18181b" roughness={0.7} />
            </mesh>
            <mesh position={[0, -0.14, -0.02]}>
              <boxGeometry args={[0.1, 0.12, 0.02]} />
              <meshStandardMaterial color="#18181b" roughness={0.7} />
            </mesh>
          </group>
        </group>
      );

    // --- 9. PORTABLE NVMe SSD DOCKS ---
    case 'ssd-docks':
      return (
        <group position={[0, 0.02, 0]}>
          {[-0.1, 0.1].map((z, idx) => (
            <group key={`ssd-${idx}`} position={[0, 0, z]}>
              {/* CNC Aluminum Enclosure */}
              <mesh castShadow>
                <boxGeometry args={[0.16, 0.04, 0.28]} />
                <meshStandardMaterial color={primaryColor} metalness={0.88} roughness={0.2} />
              </mesh>
              {/* Cooling Ribs */}
              {[-0.08, -0.04, 0, 0.04, 0.08].map((rz, ri) => (
                <mesh key={`rib-${ri}`} position={[0, 0.022, rz]}>
                  <boxGeometry args={[0.14, 0.006, 0.015]} />
                  <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.1} />
                </mesh>
              ))}
              {/* Status Cyan LED Bar */}
              <mesh position={[0.075, 0.01, 0.12]}>
                <boxGeometry args={[0.012, 0.01, 0.03]} />
                <meshStandardMaterial color="#00f2fe" emissive="#00f2fe" emissiveIntensity={3.0} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 10. SKINCARE DROPPER BOTTLES (Trio) ---
    case 'skincare':
      return (
        <group>
          {[-0.16, 0, 0.16].map((z, idx) => (
            <group key={`skin-${idx}`} position={[0, 0.02, z]}>
              {/* Frosted Glass Dropper Bottle */}
              <mesh position={[0, -0.04, 0]} castShadow>
                <cylinderGeometry args={[0.065, 0.065, 0.2, 20]} />
                <meshPhysicalMaterial
                  color={primaryColor}
                  roughness={0.15}
                  transmission={0.75}
                  thickness={0.15}
                />
              </mesh>
              {/* Rose Gold Collar */}
              <mesh position={[0, 0.08, 0]}>
                <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
                <meshStandardMaterial color="#fb7185" metalness={0.9} roughness={0.15} />
              </mesh>
              {/* Rubber Pipette Bulb */}
              <mesh position={[0, 0.13, 0]}>
                <sphereGeometry args={[0.036, 16, 16]} />
                <meshStandardMaterial color="#ffffff" roughness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 11. SHAMPOO PUMP DUO ---
    case 'shampoo':
      return (
        <group>
          {[-0.14, 0.14].map((z, idx) => (
            <group key={`shamp-${idx}`} position={[0, 0.05, z]}>
              {/* Matte Body Cylinder */}
              <mesh castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.32, 20]} />
                <meshStandardMaterial color={primaryColor} roughness={0.3} metalness={0.1} />
              </mesh>
              {/* Bottle Neck */}
              <mesh position={[0, 0.18, 0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.04, 16]} />
                <meshStandardMaterial color="#0f172a" metalness={0.5} />
              </mesh>
              {/* Dispenser Pump Head */}
              <mesh position={[0.03, 0.22, 0]}>
                <boxGeometry args={[0.09, 0.035, 0.04]} />
                <meshStandardMaterial color="#0f172a" roughness={0.3} metalness={0.6} />
              </mesh>
            </group>
          ))}
        </group>
      );

    // --- 12. HAUTE PERFUME FLACON ---
    case 'perfume':
      return (
        <group position={[0, 0.04, 0]}>
          {/* Heavy Base Crystal Glass Flacon */}
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.28, 0.14]} />
            <meshPhysicalMaterial
              color={primaryColor}
              roughness={0.05}
              transmission={0.88}
              thickness={0.3}
            />
          </mesh>
          {/* Internal Perfume Core */}
          <mesh position={[0, -0.02, 0]}>
            <boxGeometry args={[0.16, 0.18, 0.08]} />
            <meshStandardMaterial color={primaryColor} emissive={primaryColor} emissiveIntensity={0.5} />
          </mesh>
          {/* Polished Gold Collar */}
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.04, 16]} />
            <meshStandardMaterial color="#facc15" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Sculptural Black Magnetic Cap */}
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.09, 0.08, 0.09]} />
            <meshStandardMaterial color="#18181b" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      );

    default:
      return null;
  }
};
