
export enum SelectionType {
  SINGLE = 'SINGLE',
  MULTIPLE = 'MULTIPLE'
}

export interface Addon {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
}

export interface AddonGroup {
  id: string;
  storeId: string;
  title: string;
  type: SelectionType;
  minSelection: number;
  maxSelection: number;
  addons: Addon[];
}

export interface Combo {
  id: string;
  storeId: string;
  name: string;
  description: string;
  price: number;
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl: string;
  addonGroupIds: string[]; // Referência aos grupos globais
  upsellIds: string[]; // Referência aos combos/upsells globais
  sortOrder: number;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  sortOrder: number;
}

export interface OperatingHours {
  open: string; // "08:00"
  close: string; // "22:00"
}

export interface Store {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  primaryColor: string;
  whatsapp: string;
  logoUrl?: string;
  bannerUrl?: string;
  facebookPixelId?: string;
  operatingHours: OperatingHours;
  analytics: {
    visits: number;
    productViews: number;
    whatsappClicks: number;
  };
}

export interface User {
  id: string;
  email: string;
  whatsapp: string;
}

export interface AppState {
  user: User | null;
  stores: Store[];
  categories: Category[];
  products: Product[];
  addonGroups: AddonGroup[]; // Biblioteca global de complementos
  combos: Combo[]; // Biblioteca global de combos/upsells
}
