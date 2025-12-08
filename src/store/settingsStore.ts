import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { 
  OrganizationSettings, 
  Terminal, 
  UnitOfMeasure, 
  StockLocation,
  LoyaltySettings,
  MpesaSettings,
  SMSSettings,
  Category
} from '@/types';

interface SettingsStore {
  organization: OrganizationSettings;
  terminals: Terminal[];
  unitsOfMeasure: UnitOfMeasure[];
  stockLocations: StockLocation[];
  categories: Category[];
  loyaltySettings: LoyaltySettings;
  mpesaSettings: MpesaSettings;
  smsSettings: SMSSettings;
  
  // Organization
  updateOrganization: (updates: Partial<OrganizationSettings>) => void;
  
  // Terminals
  addTerminal: (terminal: Omit<Terminal, 'id'>) => void;
  updateTerminal: (id: string, updates: Partial<Terminal>) => void;
  deleteTerminal: (id: string) => void;
  
  // Units of Measure
  addUOM: (uom: Omit<UnitOfMeasure, 'id'>) => void;
  updateUOM: (id: string, updates: Partial<UnitOfMeasure>) => void;
  deleteUOM: (id: string) => void;
  
  // Stock Locations
  addStockLocation: (location: Omit<StockLocation, 'id'>) => void;
  updateStockLocation: (id: string, updates: Partial<StockLocation>) => void;
  deleteStockLocation: (id: string) => void;
  
  // Categories
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addSubcategory: (categoryId: string, subcategory: string) => void;
  removeSubcategory: (categoryId: string, subcategory: string) => void;
  
  // Loyalty Settings
  updateLoyaltySettings: (updates: Partial<LoyaltySettings>) => void;
  
  // M-pesa Settings
  updateMpesaSettings: (updates: Partial<MpesaSettings>) => void;
  
  // SMS Settings
  updateSMSSettings: (updates: Partial<SMSSettings>) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const defaultOrganization: OrganizationSettings = {
  name: 'Ringo Retail Shop',
  phone: '+254 700 000 000',
  email: '',
  address: 'Nairobi, Kenya',
  kraPin: 'A000000000A',
  vatNumber: '0000000000',
  currency: 'KES',
  timezone: 'Africa/Nairobi',
  receiptFooter: 'Thank you for shopping with us!',
  autoPrintReceipt: false,
  lowStockAlerts: true,
  darkMode: false,
};

const defaultUOMs: UnitOfMeasure[] = [
  { id: '1', name: 'Piece', abbreviation: 'PC' },
  { id: '2', name: 'Kilogram', abbreviation: 'KG' },
  { id: '3', name: 'Liter', abbreviation: 'L' },
  { id: '4', name: 'Box', abbreviation: 'BOX' },
  { id: '5', name: 'Carton', abbreviation: 'CTN' },
  { id: '6', name: 'Dozen', abbreviation: 'DZ' },
];

const defaultCategories: Category[] = [
  { id: '1', name: 'Beverages', subcategories: ['Soft Drinks', 'Water', 'Juices', 'Energy Drinks'] },
  { id: '2', name: 'Snacks', subcategories: ['Chips', 'Biscuits', 'Chocolates', 'Nuts'] },
  { id: '3', name: 'Dairy', subcategories: ['Milk', 'Yogurt', 'Cheese', 'Butter'] },
  { id: '4', name: 'Groceries', subcategories: ['Rice', 'Flour', 'Sugar', 'Cooking Oil'] },
  { id: '5', name: 'Personal Care', subcategories: ['Soap', 'Shampoo', 'Toothpaste', 'Deodorant'] },
];

const defaultLoyaltySettings: LoyaltySettings = {
  pointsPerAmount: 100, // 1 point per 100 KES
  redeemPointValue: 1, // 1 point = 1 KES
  minRedeemPoints: 100,
  tierThresholds: {
    silver: 1000,
    gold: 5000,
    platinum: 10000,
  },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      organization: defaultOrganization,
      terminals: [{ id: '1', name: 'Main Terminal', location: 'Counter 1', isActive: true }],
      unitsOfMeasure: defaultUOMs,
      stockLocations: [{ id: '1', name: 'Main Store', address: 'Nairobi', isDefault: true }],
      categories: defaultCategories,
      loyaltySettings: defaultLoyaltySettings,
      mpesaSettings: { isConfigured: false },
      smsSettings: { isConfigured: false },

      updateOrganization: (updates) => {
        set((state) => ({
          organization: { ...state.organization, ...updates },
        }));
      },

      addTerminal: (terminal) => {
        set((state) => ({
          terminals: [...state.terminals, { ...terminal, id: generateId() }],
        }));
      },

      updateTerminal: (id, updates) => {
        set((state) => ({
          terminals: state.terminals.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      deleteTerminal: (id) => {
        set((state) => ({
          terminals: state.terminals.filter((t) => t.id !== id),
        }));
      },

      addUOM: (uom) => {
        set((state) => ({
          unitsOfMeasure: [...state.unitsOfMeasure, { ...uom, id: generateId() }],
        }));
      },

      updateUOM: (id, updates) => {
        set((state) => ({
          unitsOfMeasure: state.unitsOfMeasure.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }));
      },

      deleteUOM: (id) => {
        set((state) => ({
          unitsOfMeasure: state.unitsOfMeasure.filter((u) => u.id !== id),
        }));
      },

      addStockLocation: (location) => {
        set((state) => ({
          stockLocations: [...state.stockLocations, { ...location, id: generateId() }],
        }));
      },

      updateStockLocation: (id, updates) => {
        set((state) => ({
          stockLocations: state.stockLocations.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));
      },

      deleteStockLocation: (id) => {
        set((state) => ({
          stockLocations: state.stockLocations.filter((l) => l.id !== id),
        }));
      },

      addCategory: (category) => {
        set((state) => ({
          categories: [...state.categories, { ...category, id: generateId() }],
        }));
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((c) => c.id !== id),
        }));
      },

      addSubcategory: (categoryId, subcategory) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId
              ? { ...c, subcategories: [...c.subcategories, subcategory] }
              : c
          ),
        }));
      },

      removeSubcategory: (categoryId, subcategory) => {
        set((state) => ({
          categories: state.categories.map((c) =>
            c.id === categoryId
              ? { ...c, subcategories: c.subcategories.filter((s) => s !== subcategory) }
              : c
          ),
        }));
      },

      updateLoyaltySettings: (updates) => {
        set((state) => ({
          loyaltySettings: { ...state.loyaltySettings, ...updates },
        }));
      },

      updateMpesaSettings: (updates) => {
        set((state) => ({
          mpesaSettings: { ...state.mpesaSettings, ...updates },
        }));
      },

      updateSMSSettings: (updates) => {
        set((state) => ({
          smsSettings: { ...state.smsSettings, ...updates },
        }));
      },
    }),
    { name: 'settings-storage' }
  )
);
