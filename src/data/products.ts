import { Product, TeleportZone } from '../types/store';

export const PRODUCTS: Product[] = [
  // --- AISLE 1: BEVERAGES (Shelf at X = -8, Tray at X = -7.55, Y = 1.28) ---
  {
    id: 'bev-1',
    name: 'Coca-Cola Original Taste 1.5L Bottle',
    category: 'Beverages',
    aisle: 1,
    price: 3.29,
    rating: 5.0,
    tag: 'Iconic 1.5L',
    shortSpec: 'Chilled 1.5-liter PET contour bottle with signature red label & effervescent caramel soda',
    description: 'The legendary classic 1.5-liter Coca-Cola contour bottle. Modeled with authentic PET plastic curves, petaloid 5-lobed standing base, signature red waist label, red threaded screw cap, fizzy caramel liquid, and glistening cold moisture droplets.',
    specs: {
      'Volume': '1.5 Liters (50.7 fl oz)',
      'Bottle Type': '100% Recycled PET Plastic (rPET)',
      'Base Design': 'Petaloid 5-Lobed Standing Base',
      'Calories': '105 kcal per 250ml serving',
      'Sugar': '27g Natural Sugar',
      'Cap': 'Tamper-Evident Red Threaded Seal'
    },
    stock: 48,
    position: [-7.55, 1.28, 2.2],
    clusterType: 'soda-cans',
    primaryColor: '#dc2626',
    secondaryColor: '#ffffff'
  },
  {
    id: 'bev-2',
    name: 'Neon Surge Electrolyte Elixir',
    category: 'Beverages',
    aisle: 1,
    price: 11.49,
    rating: 4.8,
    tag: 'Performance',
    shortSpec: 'Cold-pressed lime & yuzu with bio-available Himalayan trace minerals',
    description: 'Formulated for rapid cellular hydration without synthetic dyes. Infused with natural magnesium, pink Himalayan minerals, and fresh Japanese yuzu zest.',
    specs: {
      'Pack Size': '4 × 355ml Slim Cans',
      'Electrolytes': '850mg per can',
      'Carbs': '2g Natural Fruit',
      'Vitamins': 'B3, B6, B12 + Zinc',
      'Flavor Profile': 'Crisp Electric Citrus'
    },
    stock: 28,
    position: [-7.55, 1.28, -0.5],
    clusterType: 'energy-cans',
    primaryColor: '#10b981',
    secondaryColor: '#facc15'
  },
  {
    id: 'bev-3',
    name: 'Vossier Glacial Sparkling Water',
    category: 'Beverages',
    aisle: 1,
    price: 14.50,
    rating: 4.9,
    tag: 'Artisan',
    shortSpec: 'Single-source Norwegian glacier water with delicate champagne effervescence',
    description: 'Sourced from centuries-old subterranean aquifers in the high alpine valleys. Bottled directly at the source in sculptural heavy-base flint glass.',
    specs: {
      'Pack Size': '4 × 750ml Glass Bottles',
      'Source': 'Jostedalsbreen Aquifer',
      'TDS': '22mg/L (Ultra Pure)',
      'pH Level': '7.4 Optimal Neutral',
      'Bottle': 'Custom Frosted Flint Glass'
    },
    stock: 19,
    position: [-7.55, 1.28, -3.2],
    clusterType: 'water-bottles',
    primaryColor: '#38bdf8',
    secondaryColor: '#e0f2fe'
  },

  // --- AISLE 2: GROCERIES (Shelf at X = -3, Tray at X = -2.55, Y = 1.28) ---
  {
    id: 'groc-1',
    name: 'Golden Spelt Ancient Grain Flakes',
    category: 'Groceries',
    aisle: 2,
    price: 6.89,
    rating: 4.7,
    tag: 'Organic',
    shortSpec: 'Stone-milled heritage grains lightly toasted with wildflower clover honey',
    description: 'Sustainably farmed heirloom spelt grain crisped in small batch wood-fired ovens. High in prebiotic fiber and complex carbs for all-day sustained stamina.',
    specs: {
      'Net Weight': '450g / 15.8 oz Box',
      'Fiber': '7g per serving',
      'Grain Heritage': '100% Certified Heirloom Spelt',
      'Sweetener': 'Raw Montana Wildflower Honey',
      'Allergens': 'Non-GMO, Contains Spelt Wheat'
    },
    stock: 35,
    position: [-2.55, 1.28, 2.2],
    clusterType: 'cereal-boxes',
    primaryColor: '#f59e0b',
    secondaryColor: '#78350f'
  },
  {
    id: 'groc-2',
    name: 'Obsidian 85% Single-Origin Cacao',
    category: 'Groceries',
    aisle: 2,
    price: 9.99,
    rating: 5.0,
    tag: 'Rare Harvest',
    shortSpec: 'Direct trade Chuao Venezuelan criollo beans conched for 72 continuous hours',
    description: 'Tasting notes of black cherry, roasted hazelnut, and smoked sea salt. Master chocolatier crafted using raw unrefined organic cane sugar crystals.',
    specs: {
      'Weight': '3 × 80g Tasting Bars',
      'Cacao Content': '85% Single-Origin Criollo',
      'Processing': '72hr Granite Stone Conching',
      'Origin': 'Chuao Valley, Venezuela',
      'Certification': 'Demeter Biodynamic & Fair Trade'
    },
    stock: 22,
    position: [-2.55, 1.28, -0.5],
    clusterType: 'chocolate-bars',
    primaryColor: '#854d0e',
    secondaryColor: '#d97706'
  },
  {
    id: 'groc-3',
    name: 'Sol Terra Cold-Pressed EVOO',
    category: 'Groceries',
    aisle: 2,
    price: 24.00,
    rating: 4.9,
    tag: 'Estate Reserve',
    shortSpec: 'First-harvest Koroneiki olives cold-pressed within 3 hours of picking',
    description: 'An exceptional monovarietal olive oil with vibrant peppery polyphenols, grassy green notes, and an ultra-low acidity of under 0.18%. Protected in UV-blocking matte tin.',
    specs: {
      'Volume': '750ml UV-Shield Steel Tin',
      'Acidity': '< 0.18% Extra Virgin',
      'Polyphenols': '620mg/kg (Super Antioxidant)',
      'Harvest Year': '2026 Estate Single Batch',
      'Origin': 'Peloponnese, Greece'
    },
    stock: 16,
    position: [-2.55, 1.28, -3.2],
    clusterType: 'olive-oil',
    primaryColor: '#65a30d',
    secondaryColor: '#ca8a04'
  },

  // --- AISLE 3: ELECTRONICS (Shelf at X = +3, Tray at X = 2.55, Y = 1.28) ---
  {
    id: 'tech-1',
    name: 'AeroSound Pro ANC Headphones',
    category: 'Electronics',
    aisle: 3,
    price: 249.99,
    rating: 4.9,
    tag: 'Flagship Tech',
    shortSpec: 'Hybrid 42dB active noise cancellation with 40mm custom graphene drivers',
    description: 'Studio-grade spatial acoustic tuning paired with memory foam earcups wrapped in breathable protein leather. 55-hour battery life with 10-minute quick charge.',
    specs: {
      'Audio Driver': '40mm Bespoke Diamond-Graphene',
      'Noise Cancellation': 'Hybrid Active ANC -42dB',
      'Battery Life': '55 Hours (ANC Off) / 42 Hours (On)',
      'Connectivity': 'Bluetooth 5.4 LE Audio & Low-Latency 2.4G',
      'Weight': '248g Lightweight Aerospace Composite'
    },
    stock: 14,
    position: [2.55, 1.28, 2.2],
    clusterType: 'headphones',
    primaryColor: '#0ea5e9',
    secondaryColor: '#1e293b'
  },
  {
    id: 'tech-2',
    name: 'Kronos Horizon AMOLED Smartwatch',
    category: 'Electronics',
    aisle: 3,
    price: 329.00,
    rating: 4.8,
    tag: 'New Release',
    shortSpec: 'Sapphire crystal 1.43" 120Hz display with titanium grade-5 unibody casing',
    description: 'Clinical grade ECG, optical PPG blood oxygen sensor, dual-frequency GNSS navigation, and 5ATM water resistance. Features an always-on 2,000-nit peak display.',
    specs: {
      'Display': '1.43" Ultra-Retina LTPO AMOLED, 120Hz',
      'Chassis': 'Aero-Grade Titanium & Ceramic Back',
      'Water Rating': '5 ATM / 50m Depth Safe',
      'Sensors': 'ECG, PPG, SpO2, Skin Temp, Barometer',
      'Battery': 'Up to 14 Days Typical Endurance'
    },
    stock: 11,
    position: [2.55, 1.28, -0.5],
    clusterType: 'smartwatch',
    primaryColor: '#8b5cf6',
    secondaryColor: '#312e81'
  },
  {
    id: 'tech-3',
    name: 'HyperDrive 4TB MagSafe NVMe Enclosure',
    category: 'Electronics',
    aisle: 3,
    price: 189.95,
    rating: 4.9,
    tag: 'Pro Creative',
    shortSpec: 'USB4 40Gbps sustained speed with magnetic snap-on aluminum thermal fin shell',
    description: 'Engineered for 4K ProRes external recording on mobile devices and blazingly fast video editing rigs. Passive cooling thermal architecture keeps sustained read/write above 3,200 MB/s.',
    specs: {
      'Capacity': '4TB PCIe 4.0 TLC High-Endurance',
      'Max Throughput': 'Up to 3,400 MB/s Read / 3,100 MB/s Write',
      'Interface': 'USB4 / Thunderbolt 4 Compatible',
      'Attachment': 'Built-in N52 MagSafe Ring Array',
      'Cooling': 'CNC Monolithic Aluminum Heatsink'
    },
    stock: 20,
    position: [2.55, 1.28, -3.2],
    clusterType: 'ssd-docks',
    primaryColor: '#64748b',
    secondaryColor: '#00f2fe'
  },

  // --- AISLE 4: PERSONAL CARE (Shelf at X = +8, Tray at X = 7.55, Y = 1.28) ---
  {
    id: 'care-1',
    name: 'Lumina Tri-Peptide Renewal Serum',
    category: 'Personal Care',
    aisle: 4,
    price: 48.00,
    rating: 4.9,
    tag: 'Dermatologist Tested',
    shortSpec: 'Micro-encapsulated matrixyl 3000, 2% hyaluronic acid, and blue tansy extract',
    description: 'An ultra-light, rapid-absorbing bio-fermented facial elixir designed to restore the epidermal moisture barrier and dramatically smooth fine lines.',
    specs: {
      'Volume': '50ml Frosted Dropper Bottle',
      'Active Ingredients': 'Matrixyl 3000, Multi-MW Hyaluronic, Niacinamide',
      'Skin Type': 'Sensitive, Dehydrated, and Mature Skin',
      'Formulation': '100% Vegan, Cruelty-Free, Paraben-Free',
      'Absorption': 'Silky Non-Greasy Finish under 30s'
    },
    stock: 31,
    position: [7.55, 1.28, 2.2],
    clusterType: 'skincare',
    primaryColor: '#f43f5e',
    secondaryColor: '#fecdd3'
  },
  {
    id: 'care-2',
    name: 'Botanica Biome Keratin Shampoo Duo',
    category: 'Personal Care',
    aisle: 4,
    price: 34.50,
    rating: 4.7,
    tag: 'Eco-Luxury',
    shortSpec: 'Fermented bamboo water, hydrolysed plant keratin, and cold-pressed cedarwood',
    description: 'A sulfate-free restorative wash and conditioner set designed to nurture the scalp microbiome while infusing hair shafts with deep molecular resilience and shine.',
    specs: {
      'Volume': '2 × 400ml Recycled Pump Bottles',
      'Scent Profile': 'Atlas Cedar, Crisp Bergamot, Fresh Vetiver',
      'Clean Formula': 'Zero Sulfates, Silicones, or Phthalates',
      'Scalp Benefit': 'Microbiome Balancing Prebiotic Blend',
      'Hair Type': 'Color-Treated and Dry/Damaged Hair'
    },
    stock: 25,
    position: [7.55, 1.28, -0.5],
    clusterType: 'shampoo',
    primaryColor: '#14b8a6',
    secondaryColor: '#ccfbf1'
  },
  {
    id: 'care-3',
    name: 'Maison Nocturne Eau De Parfum',
    category: 'Personal Care',
    aisle: 4,
    price: 88.00,
    rating: 5.0,
    tag: 'Haute Parfumerie',
    shortSpec: 'Smoked amber, black cardamom, iris butter, and Haitian vetiver',
    description: 'An enigmatic, magnetic evening fragrance crafted in Grasse, France. Opens with sparkling pink pepper before settling into rich velvet woods and incense.',
    specs: {
      'Concentration': 'Eau De Parfum (22% Pure Essence)',
      'Volume': '100ml / 3.4 fl oz Glass Flacon',
      'Top Notes': 'Black Cardamom, Calabrian Bergamot, Pink Peppercorn',
      'Heart Notes': 'Florentine Orris, Smoked Incense, Damask Rose',
      'Base Notes': 'Amber Crystal, Bourbon Vanilla, Haitian Vetiver'
    },
    stock: 15,
    position: [7.55, 1.28, -3.2],
    clusterType: 'perfume',
    primaryColor: '#a855f7',
    secondaryColor: '#f3e8ff'
  }
];

export const TELEPORT_ZONES: TeleportZone[] = [
  {
    id: 'entrance',
    label: 'Entrance Lobby',
    sublabel: 'Main Store Concourse',
    position: [0, 1.7, 12],
    lookAt: [0, 1.7, 0]
  },
  {
    id: 'aisle-1',
    label: 'Aisle 01',
    sublabel: 'Craft Beverages',
    aisleNumber: 1,
    position: [-6.1, 1.7, 0],
    lookAt: [-7.55, 1.4, 0]
  },
  {
    id: 'aisle-2',
    label: 'Aisle 02',
    sublabel: 'Artisan Groceries',
    aisleNumber: 2,
    position: [-1.1, 1.7, 0],
    lookAt: [-2.55, 1.4, 0]
  },
  {
    id: 'aisle-3',
    label: 'Aisle 03',
    sublabel: 'Tech & Gadgets',
    aisleNumber: 3,
    position: [1.1, 1.7, 0],
    lookAt: [2.55, 1.4, 0]
  },
  {
    id: 'aisle-4',
    label: 'Aisle 04',
    sublabel: 'Personal Care',
    aisleNumber: 4,
    position: [6.1, 1.7, 0],
    lookAt: [7.55, 1.4, 0]
  },
  {
    id: 'checkout',
    label: 'Checkout',
    sublabel: 'Self-Service Pods',
    position: [8.5, 1.7, 11],
    lookAt: [9.5, 1.5, 7.5]
  }
];
