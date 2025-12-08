import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StockItem, Sale } from '@/types';

interface StockStore {
  items: StockItem[];
  sales: Sale[];
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateItem: (id: string, item: Partial<StockItem>) => void;
  deleteItem: (id: string) => void;
  getItem: (id: string) => StockItem | undefined;
  addSale: (sale: Omit<Sale, 'id'>) => Sale;
  getSalesByDateRange: (from: Date, to: Date) => Sale[];
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useStockStore = create<StockStore>()(
  persist(
    (set, get) => ({
      items: [],
      sales: [],
      
      addItem: (item) => {
        const newItem: StockItem = {
          ...item,
          id: generateId(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ items: [...state.items, newItem] }));
      },
      
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, ...updates, updatedAt: Date.now() }
              : item
          ),
        }));
      },
      
      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      getItem: (id) => {
        return get().items.find((item) => item.id === id);
      },
      
      addSale: (sale) => {
        const newSale: Sale = {
          ...sale,
          id: generateId(),
        };
        // Deduct quantities from stock
        set((state) => ({
          sales: [...state.sales, newSale],
          items: state.items.map((item) => {
            const soldItem = sale.items.find((s) => s.itemId === item.id);
            if (soldItem) {
              return {
                ...item,
                quantity: Math.max(0, item.quantity - soldItem.quantity),
                updatedAt: Date.now(),
              };
            }
            return item;
          }),
        }));
        return newSale;
      },
      
      getSalesByDateRange: (from, to) => {
        const fromTime = from.getTime();
        const toTime = to.getTime();
        return get().sales.filter(
          (sale) => sale.timestamp >= fromTime && sale.timestamp <= toTime
        );
      },
    }),
    {
      name: 'stock-sales-storage',
    }
  )
);
