import { create } from 'zustand';
import { Product, CartItem } from '../types/store';

interface StoreState {
  hasEntered: boolean;
  activeProduct: Product | null;
  hoveredProduct: Product | null;
  cart: CartItem[];
  isCartOpen: boolean;
  isAudioMuted: boolean;
  cameraTarget: {
    position: [number, number, number];
    lookAt: [number, number, number];
  } | null;
  playerPos: [number, number, number];
  isHoveringInteractive: boolean;

  // Actions
  enterStore: () => void;
  setActiveProduct: (product: Product | null) => void;
  setHoveredProduct: (product: Product | null) => void;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  setCartOpen: (open: boolean) => void;
  toggleAudio: () => void;
  teleportTo: (position: [number, number, number], lookAt: [number, number, number]) => void;
  clearTeleportTarget: () => void;
  setPlayerPos: (pos: [number, number, number]) => void;
  setIsHoveringInteractive: (isHovering: boolean) => void;
}

export const useStore = create<StoreState>((set) => ({
  hasEntered: false,
  activeProduct: null,
  hoveredProduct: null,
  cart: [],
  isCartOpen: false,
  isAudioMuted: false,
  cameraTarget: null,
  playerPos: [0, 1.7, 22.0],
  isHoveringInteractive: false,

  enterStore: () => {
    set({
      hasEntered: true,
      cameraTarget: {
        position: [0, 1.7, 19.0],
        lookAt: [0, 1.7, 0],
      },
    });
  },

  setActiveProduct: (product) => set({ activeProduct: product }),
  setHoveredProduct: (product) => set({ hoveredProduct: product }),

  addToCart: (product, quantity = 1) => {
    set((state) => {
      const existingIndex = state.cart.findIndex(
        (item) => item.product.id === product.id
      );
      if (existingIndex > -1) {
        const newCart = [...state.cart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + quantity,
        };
        return { cart: newCart };
      }
      return { cart: [...state.cart, { product, quantity }] };
    });
  },

  removeFromCart: (productId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.product.id !== productId),
    }));
  },

  updateCartQuantity: (productId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        return {
          cart: state.cart.filter((item) => item.product.id !== productId),
        };
      }
      return {
        cart: state.cart.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      };
    });
  },

  clearCart: () => set({ cart: [] }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  setCartOpen: (open) => set({ isCartOpen: open }),
  toggleAudio: () => set((state) => ({ isAudioMuted: !state.isAudioMuted })),

  teleportTo: (position, lookAt) =>
    set({
      cameraTarget: { position, lookAt },
      hoveredProduct: null,
    }),

  clearTeleportTarget: () => set({ cameraTarget: null }),
  setPlayerPos: (pos) => set({ playerPos: pos }),
  setIsHoveringInteractive: (isHovering) =>
    set({ isHoveringInteractive: isHovering }),
}));
