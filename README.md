# NEXUS MART — Interactive 3D Virtual Retail Store

A high-end, portfolio-grade 3D virtual retail experience built with **React**, **Three.js**, **@react-three/fiber**, **@react-three/drei**, **Tailwind CSS**, and **Zustand**.

## Key Highlights & Architecture

### 1. Custom "Head & Eye" Spatial Cursor & Camera System
- **No PointerLock Lock-in:** Unlike standard FPS controllers that trap the mouse in the center, NEXUS MART implements an eye & head control system.
- **Center 65% Deadzone (Eye Movement):** Moving the mouse within the central 65% of the viewport lets the custom spatial cursor glide freely across the screen to hover, inspect, and interact with products.
- **Outer 35% Edge-Panning (Head Movement):** Driving the cursor into screen margins initiates smooth camera rotation (yaw left/right and clamped pitch up/down).
- **WASD / Arrow Navigation:** Smooth first-person walking with inertia damping, subtle head-bobbing, and collision detection against walls and shelves.

### 2. Procedural Clustered 3D Assets (Zero External GLB Dependencies)
- 12 distinct clustered product batches created entirely with Three.js primitives and realistic PBR materials:
  - **Aisle 01 (Craft Beverages):** Crimson Zero 6-pack cola cans, Neon Surge 4-pack energy cans, Vossier Glacial glass bottles.
  - **Aisle 02 (Artisan Groceries):** Golden Spelt cereal boxes, Obsidian 85% single-origin cacao bars, Sol Terra cold-pressed olive oil tins.
  - **Aisle 03 (Tech & Gadgets):** AeroSound Pro ANC headphones on acoustic stand, Kronos Horizon AMOLED smartwatch pedestal, HyperDrive 4TB MagSafe NVMe SSD docks.
  - **Aisle 04 (Personal Care):** Lumina Tri-Peptide dropper bottles, Botanica Biome shampoo duo, Maison Nocturne crystal eau de parfum flacon.

### 3. Distance-Based Hotspots & Double-Tier Inspection
- **Performance Distance Culling:** Hotspots automatically fade out when farther than 5 meters to maintain clean aesthetics and high framerates.
- **Tier 1 — Floating 3D Quick Cards:** Hovering over any hotspot reveals a glassmorphism quick preview card above the shelf.
- **Tier 2 — Interactive 3D Modal:** Clicking opens a full-screen glassmorphic inspect modal with a live rotating 3D canvas, nutrition/tech specs, quantity selector, and cart integration.

### 4. Audio Synthesizer (Web Audio API)
- 100% synthesized in real time via the Web Audio API — zero external MP3s or network dependencies:
  - Ambient warm harmonic retail lounge drone.
  - Micro-chirp UI hover ticks.
  - Tactile selection clicks.
  - Harmonious ascending chord for cart additions.
  - Low-frequency filter sweep for aisle teleportation.

### 5. Quick Teleport Navigation & Live Shopping Cart
- Bottom navigation bar with direct teleportation pills to Entrance, Aisle 01, Aisle 02, Aisle 03, Aisle 04, and Checkout.
- Slide-out glassmorphic cart drawer with live item count, quantity management, tax calculation, and simulated drone checkout flow.

## Running Locally

```bash
# Start development server
npm run dev

# Build production bundle
npm run build

# Preview production build
npm run preview
```
