export type ProductCategory = 'Beverages' | 'Groceries' | 'Electronics' | 'Personal Care';

export type ClusterType = 
  | 'soda-cans' 
  | 'energy-cans' 
  | 'water-bottles' 
  | 'cereal-boxes' 
  | 'chocolate-bars' 
  | 'olive-oil' 
  | 'headphones' 
  | 'smartwatch' 
  | 'ssd-docks' 
  | 'skincare' 
  | 'shampoo' 
  | 'perfume';

export interface Product {
  id: string;
  name: string;
  category: ProductCategory;
  aisle: number; // 1 to 4
  price: number;
  rating: number;
  tag: string;
  shortSpec: string;
  description: string;
  specs: Record<string, string>;
  stock: number;
  position: [number, number, number]; // 3D shelf position
  clusterType: ClusterType;
  primaryColor: string;
  secondaryColor: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface TeleportZone {
  id: string;
  label: string;
  sublabel: string;
  aisleNumber?: number;
  position: [number, number, number];
  lookAt: [number, number, number];
}
