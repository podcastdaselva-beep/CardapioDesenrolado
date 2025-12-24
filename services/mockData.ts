
// Fix: Use addonGroupIds and upsellIds as defined in the Product type in types.ts.
import { Store, Category, Product, SelectionType, User, AddonGroup } from '../types';

export const mockUser: User = {
  id: 'user_1',
  email: 'dono@lanchonete.com',
  whatsapp: '5511999999999'
};

export const mockStores: Store[] = [
  {
    id: 'store_1',
    ownerId: 'user_1',
    name: 'Burguer do Zé',
    slug: 'burguer-do-ze',
    description: 'Os melhores blends artesanais da região, feitos na brasa com ingredientes selecionados.',
    address: 'Rua das Flores, 123 - Centro, São Paulo/SP',
    primaryColor: '#ef4444',
    whatsapp: '5511988887777',
    facebookPixelId: '1234567890',
    operatingHours: { open: '18:00', close: '23:59' },
    analytics: { visits: 120, productViews: 450, whatsappClicks: 85 }
  }
];

export const mockCategories: Category[] = [
  { id: 'cat_1', storeId: 'store_1', name: 'Burguers', sortOrder: 0 },
  { id: 'cat_2', storeId: 'store_1', name: 'Bebidas', sortOrder: 1 }
];

export const mockAddonGroups: AddonGroup[] = [
  {
    id: 'group_1',
    storeId: 'store_1',
    title: 'Escolha o Pão',
    type: SelectionType.SINGLE,
    minSelection: 1,
    maxSelection: 1,
    addons: [
      { id: 'add_1', name: 'Pão Australiano', price: 0 },
      { id: 'add_2', name: 'Pão Brioche', price: 0 }
    ]
  },
  {
    id: 'group_2',
    storeId: 'store_1',
    title: 'Turbine seu lanche',
    type: SelectionType.MULTIPLE,
    minSelection: 0,
    maxSelection: 5,
    addons: [
      { id: 'add_3', name: 'Carne extra 180g', price: 12.00, imageUrl: 'https://picsum.photos/seed/meat/200/200' },
      { id: 'add_4', name: 'Bacon extra', price: 5.50, imageUrl: 'https://picsum.photos/seed/bacon/200/200' }
    ]
  }
];

export const mockProducts: Product[] = [
  {
    id: 'prod_1',
    categoryId: 'cat_1',
    name: 'X-Tudo Monstro',
    description: 'Pão brioche, carne 180g, bacon, cheddar, ovo, alface e tomate.',
    basePrice: 35.90,
    imageUrl: 'https://picsum.photos/seed/burger1/800/800',
    sortOrder: 0,
    // Fix: Replaced addonGroups (not on type Product) with addonGroupIds and added upsellIds
    addonGroupIds: ['group_1', 'group_2'],
    upsellIds: []
  },
  {
    id: 'prod_2',
    categoryId: 'cat_2',
    name: 'Coca-Cola 350ml',
    description: 'Geladinha.',
    basePrice: 7.50,
    imageUrl: 'https://picsum.photos/seed/coke/800/800',
    sortOrder: 0,
    // Fix: Replaced addonGroups with addonGroupIds and added upsellIds
    addonGroupIds: [],
    upsellIds: []
  }
];
