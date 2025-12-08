import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Customer } from '@/types';

interface CustomerStore {
  customers: Customer[];
  addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt' | 'totalPurchases' | 'currentBalance' | 'loyaltyPoints'>) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;
  getCustomer: (id: string) => Customer | undefined;
  updateBalance: (id: string, amount: number) => void;
  addLoyaltyPoints: (id: string, points: number) => void;
  redeemLoyaltyPoints: (id: string, points: number) => boolean;
  recordPurchase: (id: string, amount: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

export const useCustomerStore = create<CustomerStore>()(
  persist(
    (set, get) => ({
      customers: [],

      addCustomer: (customer) => {
        const newCustomer: Customer = {
          ...customer,
          id: generateId(),
          totalPurchases: 0,
          currentBalance: 0,
          loyaltyPoints: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set((state) => ({ customers: [...state.customers, newCustomer] }));
        return newCustomer;
      },

      updateCustomer: (id, updates) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
          ),
        }));
      },

      deleteCustomer: (id) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== id),
        }));
      },

      getCustomer: (id) => get().customers.find((c) => c.id === id),

      updateBalance: (id, amount) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, currentBalance: c.currentBalance + amount, updatedAt: Date.now() }
              : c
          ),
        }));
      },

      addLoyaltyPoints: (id, points) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, loyaltyPoints: c.loyaltyPoints + points, updatedAt: Date.now() }
              : c
          ),
        }));
      },

      redeemLoyaltyPoints: (id, points) => {
        const customer = get().getCustomer(id);
        if (!customer || customer.loyaltyPoints < points) return false;
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, loyaltyPoints: c.loyaltyPoints - points, updatedAt: Date.now() }
              : c
          ),
        }));
        return true;
      },

      recordPurchase: (id, amount) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === id
              ? { ...c, totalPurchases: c.totalPurchases + amount, updatedAt: Date.now() }
              : c
          ),
        }));
      },
    }),
    { name: 'customer-storage' }
  )
);
