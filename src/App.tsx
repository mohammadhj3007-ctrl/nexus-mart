import React, { useEffect } from 'react';
import { StoreCanvas } from './components/canvas/StoreCanvas';
import { SpatialCursor } from './components/canvas/SpatialCursor';
import { WelcomeOverlay } from './components/ui/WelcomeOverlay';
import { HUD } from './components/ui/HUD';
import { ProductModal } from './components/ui/ProductModal';
import { CartDrawer } from './components/ui/CartDrawer';
import { useStore } from './store/useStore';
import { PRODUCTS } from './data/products';

export const App: React.FC = () => {
  const enterStore = useStore((s) => s.enterStore);
  const teleportTo = useStore((s) => s.teleportTo);
  const setActiveProduct = useStore((s) => s.setActiveProduct);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('entered') === 'true') {
      enterStore();
    }
    if (params.get('aisle') === '1') {
      teleportTo([-6.0, 1.5, 2.2], [-7.55, 1.35, 2.2]);
    }
    if (params.get('modal') === 'true') {
      setActiveProduct(PRODUCTS[0]);
    }
  }, [enterStore, teleportTo, setActiveProduct]);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#07090e] select-none">
      {/* 3D WebGL Store Canvas */}
      <StoreCanvas />

      {/* Custom Futuristic Black Spatial Cursor */}
      <SpatialCursor />

      {/* Welcome Landing Screen */}
      <WelcomeOverlay />

      {/* Head-Up Display (Navigation bar, Cart trigger, Audio toggle) */}
      <HUD />

      {/* Product Detail 3D Inspect Modal */}
      <ProductModal />

      {/* Shopping Cart Drawer */}
      <CartDrawer />
    </main>
  );
};

export default App;
