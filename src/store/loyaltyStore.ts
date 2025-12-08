import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LoyaltyCard, LoyaltyTransaction } from '@/types';

interface LoyaltyStore {
  cards: LoyaltyCard[];
  transactions: LoyaltyTransaction[];
  
  // Cards
  createCard: (customerId: string, customerName: string) => LoyaltyCard;
  getCard: (cardNumber: string) => LoyaltyCard | undefined;
  getCardByCustomerId: (customerId: string) => LoyaltyCard | undefined;
  deactivateCard: (id: string) => void;
  activateCard: (id: string) => void;
  
  // Points
  earnPoints: (cardId: string, customerId: string, points: number, saleId?: string) => void;
  redeemPoints: (cardId: string, customerId: string, points: number, description?: string) => boolean;
  
  // Tier management
  updateTier: (cardId: string) => void;
  
  // Transactions
  getTransactionsByCard: (cardId: string) => LoyaltyTransaction[];
  getTransactionsByCustomer: (customerId: string) => LoyaltyTransaction[];
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
const generateCardNumber = () => 'LC' + Date.now().toString().slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();

const calculateTier = (points: number): LoyaltyCard['tier'] => {
  if (points >= 10000) return 'platinum';
  if (points >= 5000) return 'gold';
  if (points >= 1000) return 'silver';
  return 'bronze';
};

export const useLoyaltyStore = create<LoyaltyStore>()(
  persist(
    (set, get) => ({
      cards: [],
      transactions: [],

      createCard: (customerId, customerName) => {
        const newCard: LoyaltyCard = {
          id: generateId(),
          cardNumber: generateCardNumber(),
          customerId,
          customerName,
          points: 0,
          tier: 'bronze',
          isActive: true,
          createdAt: Date.now(),
        };
        set((state) => ({ cards: [...state.cards, newCard] }));
        return newCard;
      },

      getCard: (cardNumber) => get().cards.find((c) => c.cardNumber === cardNumber),

      getCardByCustomerId: (customerId) => get().cards.find((c) => c.customerId === customerId),

      deactivateCard: (id) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, isActive: false } : c)),
        }));
      },

      activateCard: (id) => {
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, isActive: true } : c)),
        }));
      },

      earnPoints: (cardId, customerId, points, saleId) => {
        const transaction: LoyaltyTransaction = {
          id: generateId(),
          cardId,
          customerId,
          type: 'earn',
          points,
          saleId,
          description: saleId ? `Points earned from sale #${saleId.slice(-6)}` : 'Points earned',
          timestamp: Date.now(),
        };

        set((state) => ({
          cards: state.cards.map((c) => {
            if (c.id === cardId) {
              const newPoints = c.points + points;
              return { ...c, points: newPoints, tier: calculateTier(newPoints) };
            }
            return c;
          }),
          transactions: [...state.transactions, transaction],
        }));
      },

      redeemPoints: (cardId, customerId, points, description) => {
        const card = get().cards.find((c) => c.id === cardId);
        if (!card || card.points < points) return false;

        const transaction: LoyaltyTransaction = {
          id: generateId(),
          cardId,
          customerId,
          type: 'redeem',
          points,
          description: description || 'Points redeemed',
          timestamp: Date.now(),
        };

        set((state) => ({
          cards: state.cards.map((c) => {
            if (c.id === cardId) {
              const newPoints = c.points - points;
              return { ...c, points: newPoints, tier: calculateTier(newPoints) };
            }
            return c;
          }),
          transactions: [...state.transactions, transaction],
        }));

        return true;
      },

      updateTier: (cardId) => {
        const card = get().cards.find((c) => c.id === cardId);
        if (card) {
          set((state) => ({
            cards: state.cards.map((c) =>
              c.id === cardId ? { ...c, tier: calculateTier(c.points) } : c
            ),
          }));
        }
      },

      getTransactionsByCard: (cardId) => 
        get().transactions.filter((t) => t.cardId === cardId),

      getTransactionsByCustomer: (customerId) => 
        get().transactions.filter((t) => t.customerId === customerId),
    }),
    { name: 'loyalty-storage' }
  )
);
