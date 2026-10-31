import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { sounds } from '../../utils/sound';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CheckCircle, Package } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const isCartOpen = useStore((s) => s.isCartOpen);
  const setCartOpen = useStore((s) => s.setCartOpen);
  const cart = useStore((s) => s.cart);
  const updateCartQuantity = useStore((s) => s.updateCartQuantity);
  const removeFromCart = useStore((s) => s.removeFromCart);
  const clearCart = useStore((s) => s.clearCart);
  const setIsHoveringInteractive = useStore((s) => s.setIsHoveringInteractive);

  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  if (!isCartOpen) return null;

  const subtotal = cart.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
  const tax = subtotal * 0.0825; // 8.25% sales tax
  const total = subtotal + tax;

  const handleClose = () => {
    sounds.playClick();
    setCartOpen(false);
    setOrderComplete(false);
  };

  const handleCheckout = () => {
    sounds.playAddToCart();
    setIsCheckingOut(true);
    setTimeout(() => {
      setIsCheckingOut(false);
      setOrderComplete(true);
      clearCart();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden pointer-events-auto">
      {/* Dim backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <aside className="w-screen max-w-md glass-panel border-l border-white/15 flex flex-col justify-between p-6 shadow-2xl animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-cyan-400" />
              <h3 className="font-heading font-bold text-lg text-white">Your Shopping Cart</h3>
            </div>
            <button
              onClick={handleClose}
              onMouseEnter={() => {
                setIsHoveringInteractive(true);
                sounds.playHover();
              }}
              onMouseLeave={() => setIsHoveringInteractive(false)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            {orderComplete ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                <CheckCircle className="w-16 h-16 text-emerald-400 animate-bounce" />
                <h4 className="font-heading text-xl font-bold text-white">Order Confirmed!</h4>
                <p className="text-slate-300 text-xs max-w-xs">
                  Thank you for shopping at NEXUS MART. Your virtual order #NX-88219 has been dispatched for instant drone delivery.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                >
                  Continue Shopping
                </button>
              </div>
            ) : cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                <Package className="w-14 h-14 stroke-1 text-slate-600" />
                <h4 className="font-heading text-base font-bold text-white">Your cart is empty</h4>
                <p className="text-xs text-slate-400 max-w-xs">
                  Stroll down Aisles 01 through 04 and add innovative items to your virtual cart.
                </p>
              </div>
            ) : (
              cart.map(({ product, quantity }) => (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.04] border border-white/5 hover:border-white/10 transition-colors"
                >
                  {/* Color Thumbnail Avatar */}
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-white/10"
                    style={{ backgroundColor: `${product.primaryColor}20` }}
                  >
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: product.primaryColor }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                      Aisle {product.aisle}
                    </span>
                    <h5 className="text-xs font-bold text-white truncate">{product.name}</h5>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      ${(product.price * quantity).toFixed(2)}
                    </span>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-1 bg-white/10 rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        updateCartQuantity(product.id, quantity - 1);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-slate-300"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-5 text-center font-mono text-xs font-bold text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        updateCartQuantity(product.id, quantity + 1);
                      }}
                      className="p-1 hover:bg-white/10 rounded text-slate-300"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      removeFromCart(product.id);
                    }}
                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer & Checkout Breakdown */}
          {cart.length > 0 && !orderComplete && (
            <div className="pt-4 border-t border-white/10 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-mono text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Tax (8.25%)</span>
                  <span className="font-mono text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Virtual Drone Delivery</span>
                  <span className="font-mono font-bold">FREE</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="font-mono text-cyan-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                onMouseEnter={() => {
                  setIsHoveringInteractive(true);
                  sounds.playHover();
                }}
                onMouseLeave={() => setIsHoveringInteractive(false)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Processing Payment...
                  </span>
                ) : (
                  <>
                    <span>Proceed to Instant Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};
