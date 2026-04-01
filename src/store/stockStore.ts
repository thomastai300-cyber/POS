import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import type { StockItem, Sale, SaleItem } from '@/types';

interface StockStore {
  items: StockItem[];
  sales: Sale[];
  isLoading: boolean;
  fetchItems: () => Promise<void>;
  fetchSales: () => Promise<void>;
  addItem: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, item: Partial<StockItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  getItem: (id: string) => StockItem | undefined;
  addSale: (sale: Omit<Sale, 'id'>) => Promise<Sale>;
  getSalesByDateRange: (from: Date, to: Date) => Sale[];
}

const mapDbToStockItem = (row: any): StockItem => ({
  id: row.id,
  barcode: row.barcode,
  name: row.name,
  category: row.category,
  subcategory: row.subcategory || undefined,
  cost: Number(row.cost),
  price: Number(row.price),
  wholesalePrice: row.wholesale_price ? Number(row.wholesale_price) : undefined,
  quantity: row.quantity,
  lowStockThreshold: row.low_stock_threshold,
  uom: row.uom,
  location: row.location || undefined,
  image: row.image || undefined,
  createdAt: new Date(row.created_at).getTime(),
  updatedAt: new Date(row.updated_at).getTime(),
});

const mapDbToSale = (row: any, items: SaleItem[]): Sale => ({
  id: row.id,
  timestamp: Number(row.timestamp),
  date: row.date,
  customerId: row.customer_id || undefined,
  customerName: row.customer_name || undefined,
  saleType: row.sale_type as 'retail' | 'wholesale',
  totalItems: row.total_items,
  subtotal: Number(row.subtotal),
  discount: Number(row.discount),
  tax: Number(row.tax),
  total: Number(row.total),
  amountPaid: Number(row.amount_paid),
  balance: Number(row.balance),
  paymentMethod: row.payment_method as Sale['paymentMethod'],
  mpesaRef: row.mpesa_ref || undefined,
  loyaltyPointsEarned: row.loyalty_points_earned || undefined,
  loyaltyPointsRedeemed: row.loyalty_points_redeemed || undefined,
  items,
  status: row.status as Sale['status'],
});

export const useStockStore = create<StockStore>()((set, get) => ({
  items: [],
  sales: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      set({ items: data.map(mapDbToStockItem) });
    }
    set({ isLoading: false });
  },

  fetchSales: async () => {
    const { data: salesData, error: salesError } = await supabase
      .from('sales')
      .select('*')
      .order('timestamp', { ascending: false });

    if (salesError || !salesData) return;

    const saleIds = salesData.map(s => s.id);
    const { data: itemsData } = await supabase
      .from('sale_items')
      .select('*')
      .in('sale_id', saleIds.length > 0 ? saleIds : ['__none__']);

    const itemsBySale: Record<string, SaleItem[]> = {};
    (itemsData || []).forEach((si: any) => {
      if (!itemsBySale[si.sale_id]) itemsBySale[si.sale_id] = [];
      itemsBySale[si.sale_id].push({
        itemId: si.item_id,
        name: si.name,
        quantity: si.quantity,
        price: Number(si.price),
        total: Number(si.total),
      });
    });

    set({
      sales: salesData.map(s => mapDbToSale(s, itemsBySale[s.id] || [])),
    });
  },

  addItem: async (item) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;

    const { data, error } = await supabase
      .from('stock_items')
      .insert({
        user_id: userData.user.id,
        barcode: item.barcode,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory || null,
        cost: item.cost,
        price: item.price,
        wholesale_price: item.wholesalePrice || null,
        quantity: item.quantity,
        low_stock_threshold: item.lowStockThreshold,
        uom: item.uom,
        location: item.location || null,
        image: item.image || null,
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({ items: [mapDbToStockItem(data), ...state.items] }));
    }
  },

  updateItem: async (id, updates) => {
    const dbUpdates: Record<string, any> = {};
    if (updates.barcode !== undefined) dbUpdates.barcode = updates.barcode;
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.subcategory !== undefined) dbUpdates.subcategory = updates.subcategory || null;
    if (updates.cost !== undefined) dbUpdates.cost = updates.cost;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.wholesalePrice !== undefined) dbUpdates.wholesale_price = updates.wholesalePrice || null;
    if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
    if (updates.lowStockThreshold !== undefined) dbUpdates.low_stock_threshold = updates.lowStockThreshold;
    if (updates.uom !== undefined) dbUpdates.uom = updates.uom;
    if (updates.location !== undefined) dbUpdates.location = updates.location || null;
    if (updates.image !== undefined) dbUpdates.image = updates.image || null;

    const { data, error } = await supabase
      .from('stock_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id ? mapDbToStockItem(data) : item
        ),
      }));
    }
  },

  deleteItem: async (id) => {
    const { error } = await supabase
      .from('stock_items')
      .delete()
      .eq('id', id);

    if (!error) {
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
    }
  },

  getItem: (id) => {
    return get().items.find((item) => item.id === id);
  },

  addSale: async (sale) => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        user_id: userData.user.id,
        timestamp: sale.timestamp,
        date: sale.date,
        customer_id: sale.customerId || null,
        customer_name: sale.customerName || null,
        sale_type: sale.saleType,
        total_items: sale.totalItems,
        subtotal: sale.subtotal,
        discount: sale.discount,
        tax: sale.tax,
        total: sale.total,
        amount_paid: sale.amountPaid,
        balance: sale.balance,
        payment_method: sale.paymentMethod,
        mpesa_ref: sale.mpesaRef || null,
        loyalty_points_earned: sale.loyaltyPointsEarned || 0,
        loyalty_points_redeemed: sale.loyaltyPointsRedeemed || 0,
        status: sale.status,
      })
      .select()
      .single();

    if (saleError || !saleData) throw new Error(saleError?.message || 'Failed to create sale');

    // Insert sale items
    if (sale.items.length > 0) {
      await supabase.from('sale_items').insert(
        sale.items.map((si) => ({
          sale_id: saleData.id,
          item_id: si.itemId,
          name: si.name,
          quantity: si.quantity,
          price: si.price,
          total: si.total,
        }))
      );
    }

    // Deduct stock quantities
    for (const si of sale.items) {
      const currentItem = get().items.find(i => i.id === si.itemId);
      if (currentItem) {
        await supabase
          .from('stock_items')
          .update({ quantity: Math.max(0, currentItem.quantity - si.quantity) })
          .eq('id', si.itemId);
      }
    }

    const newSale = mapDbToSale(saleData, sale.items);

    // Update local state
    set((state) => ({
      sales: [newSale, ...state.sales],
      items: state.items.map((item) => {
        const soldItem = sale.items.find((s) => s.itemId === item.id);
        if (soldItem) {
          return { ...item, quantity: Math.max(0, item.quantity - soldItem.quantity), updatedAt: Date.now() };
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
}));
