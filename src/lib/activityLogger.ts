import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';

export type ActivityAction = 
  | 'login' | 'logout' | 'create' | 'update' | 'delete' 
  | 'sale' | 'refund' | 'stock_adjustment' | 'role_change' | 'export';

export type ActivityModule = 
  | 'auth' | 'billing' | 'stock' | 'customers' | 'loyalty' 
  | 'accounting' | 'settings' | 'users';

interface LogActivityParams {
  action: ActivityAction;
  module: ActivityModule;
  description: string;
  metadata?: Record<string, string | number | boolean | null>;
}

async function getBusinessId(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();
  return data?.business_id || null;
}

export async function logActivity({ action, module, description, metadata = {} }: LogActivityParams) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    const bizId = await getBusinessId(user.id);

    await supabase.from('activity_logs').insert([{
      user_id: user.id,
      user_name: profile?.full_name || user.email,
      business_id: bizId,
      action,
      module,
      description,
      metadata: metadata as Json
    }]);
  } catch (error) {
    console.error('Error in logActivity:', error);
  }
}

export const ActivityLogger = {
  login: () => logActivity({ action: 'login', module: 'auth', description: 'User logged in' }),
  logout: () => logActivity({ action: 'logout', module: 'auth', description: 'User logged out' }),
  sale: (saleId: string, total: number, itemCount: number) => logActivity({
    action: 'sale', module: 'billing',
    description: `Completed sale of ${itemCount} items for KES ${total.toLocaleString()}`,
    metadata: { saleId, total, itemCount }
  }),
  stockCreate: (itemName: string, quantity: number) => logActivity({
    action: 'create', module: 'stock',
    description: `Added new stock item: ${itemName} (Qty: ${quantity})`,
    metadata: { itemName, quantity }
  }),
  stockUpdate: (itemName: string) => logActivity({
    action: 'update', module: 'stock',
    description: `Updated stock item: ${itemName}`,
    metadata: { itemName }
  }),
  stockDelete: (itemName: string) => logActivity({
    action: 'delete', module: 'stock',
    description: `Deleted stock item: ${itemName}`,
    metadata: { itemName }
  }),
  stockAdjustment: (itemName: string, oldQty: number, newQty: number) => logActivity({
    action: 'stock_adjustment', module: 'stock',
    description: `Adjusted ${itemName} quantity: ${oldQty} → ${newQty}`,
    metadata: { itemName, oldQty, newQty, change: newQty - oldQty }
  }),
  customerCreate: (customerName: string) => logActivity({
    action: 'create', module: 'customers',
    description: `Added new customer: ${customerName}`,
    metadata: { customerName }
  }),
  customerUpdate: (customerName: string) => logActivity({
    action: 'update', module: 'customers',
    description: `Updated customer: ${customerName}`,
    metadata: { customerName }
  }),
  loyaltyRedeem: (customerName: string, points: number) => logActivity({
    action: 'update', module: 'loyalty',
    description: `${customerName} redeemed ${points} loyalty points`,
    metadata: { customerName, points }
  }),
  roleChange: (userName: string, oldRole: string, newRole: string) => logActivity({
    action: 'role_change', module: 'users',
    description: `Changed ${userName}'s role from ${oldRole} to ${newRole}`,
    metadata: { userName, oldRole, newRole }
  }),
  expenseCreate: (category: string, amount: number) => logActivity({
    action: 'create', module: 'accounting',
    description: `Added expense: ${category} - KES ${amount.toLocaleString()}`,
    metadata: { category, amount }
  }),
  settingsUpdate: (setting: string) => logActivity({
    action: 'update', module: 'settings',
    description: `Updated setting: ${setting}`,
    metadata: { setting }
  }),
  dataExport: (module: ActivityModule, recordCount: number) => logActivity({
    action: 'export', module,
    description: `Exported ${recordCount} records from ${module}`,
    metadata: { recordCount }
  })
};
