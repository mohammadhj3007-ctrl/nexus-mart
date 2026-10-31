import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { ProductPreviewCanvas } from '../canvas/ProductPreviewMesh';
import { X, Star, ShoppingBag, Check, Plus, Minus, ShieldCheck, Zap } from 'lucide-react';

export const ProductModal: React.FC = () => {
  const activeProduct = useStore((s) => s.activeProduct);
  const setActiveProduct = useStore((s) => s.setActiveProduct);
  const addToCart = useStore((s) => s.addToCart);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    setQuantity(1);
    setJustAdded(false);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveProduct(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeProduct, setActiveProduct]);

  if (!activeProduct) return null;

  const handleClose = () => {
    sounds.playClick();
    setActiveProduct(null);
  };

  const handleAddToCart = () => {
    sounds.playAddToCart();
    addToCart(activeProduct, quantity);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md transition-opacity">
      {/* Click outside backdrop to close */}
      <div className="absolute inset-0" onClick={handleClose} />

      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl glass-panel border border-white/15 p-6 md:p-8 shadow-2xl z-10 flex flex-col md:flex-row gap-6 md:gap-8">
        {/* Close Button */}
        <button
          onClick={handleClose}
          onMouseEnter={() => {
            setIsHoveringInteractive(true);
            sounds.playHover();
          }}
          onMouseLeave={() => setIsHoveringInteractive(false)}
          className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors z-20"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Side: 3D Product Interactive Inspection View */}
        <div className="w-full md:w-1/2 flex flex-col gap-4">
          <ProductPreviewCanvas product={activeProduct} />

          {/* Value Badges */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Authentic Quality</span>
            </div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.04] border border-white/5 text-slate-300">
              <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Express Delivery</span>
            </div>
          </div>
        </div>

        {/* Right Side: Product Details & Purchase Form */}
        <div className="w-full md:w-1/2 flex flex-col justify-between">
          <div>
            {/* Category & Badge */}
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: `${activeProduct.primaryColor}20`,
                  color: activeProduct.primaryColor,
                  border: `1px solid ${activeProduct.primaryColor}50`,
                }}
              >
                {activeProduct.category}
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-white/10 text-slate-300 border border-white/10">
                {activeProduct.tag}
              </span>
            </div>

            {/* Title & Price */}
            <h2 className="text-2xl md:text-3xl font-extrabold font-heading text-white mb-2 leading-tight">
              {activeProduct.name}
            </h2>

            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl font-extrabold text-white font-mono">
                ${activeProduct.price.toFixed(2)}
              </span>
              <div className="flex items-center gap-1 text-amber-400 text-sm">
                <Star className="w-4 h-4 fill-amber-400" />
                <span className="font-bold">{activeProduct.rating.toFixed(1)}</span>
                <span className="text-slate-500 text-xs">(128 reviews)</span>
              </div>
            </div>

            {/* Description */}
            <p className="text-slate-300 text-sm leading-relaxed mb-6">
              {activeProduct.description}
            </p>

            {/* Specifications Grid */}
            <div className="mb-6">
              <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-2">
                Detailed Specifications
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(activeProduct.specs).map(([key, val]) => (
                  <div key={key} className="p-2 rounded-lg bg-white/[0.03] border border-white/5 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-mono uppercase">{key}</span>
                    <span className="text-slate-200 font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* In-Stock Indicator */}
            <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-6">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>In Stock — {activeProduct.stock} units remaining at this shelf</span>
            </div>
          </div>

          {/* Action Row: Quantity & Add to Cart */}
          <div className="flex items-center gap-4 pt-4 border-t border-white/10">
            {/* Quantity Controller */}
            <div className="flex items-center rounded-xl bg-white/10 border border-white/10 p-1">
              <button
                onClick={() => {
                  sounds.playClick();
                  setQuantity((q) => Math.max(1, q - 1));
                }}
                disabled={quantity <= 1}
                className="p-2 rounded-lg hover:bg-white/10 disabled:opacity-30 text-white transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-10 text-center font-mono font-bold text-white text-sm">
                {quantity}
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  setQuantity((q) => Math.min(activeProduct.stock, q + 1));
                }}
                className="p-2 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add to Cart CTA */}
            <button
              onClick={handleAddToCart}
              onMouseEnter={() => {
                setIsHoveringInteractive(true);
                sounds.playHover();
              }}
              onMouseLeave={() => setIsHoveringInteractive(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm transition-all duration-300 active:scale-95 ${
                justAdded
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(56,189,248,0.4)]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Added to Cart!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add {(quantity * activeProduct.price).toFixed(2)} to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
