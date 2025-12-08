// Stock & Products
export interface StockItem {
  id: string;
  barcode: string;
  name: string;
  category: string;
  subcategory?: string;
  cost: number;
  price: number;
  wholesalePrice?: number;
  quantity: number;
  lowStockThreshold: number;
  uom: string;
  location?: string;
  image?: string;
  createdAt: number;
  updatedAt: number;
}

export interface Category {
  id: string;
  name: string;
  subcategories: string[];
}

// Sales
export interface Sale {
  id: string;
  timestamp: number;
  date: string;
  customerId?: string;
  customerName?: string;
  saleType: 'retail' | 'wholesale';
  totalItems: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  paymentMethod: 'cash' | 'mpesa' | 'credit' | 'mixed';
  mpesaRef?: string;
  loyaltyPointsEarned?: number;
  loyaltyPointsRedeemed?: number;
  items: SaleItem[];
  status: 'completed' | 'pending' | 'cancelled';
}

export interface SaleItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  date: number;
  dueDate: number;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
}

// Customers
export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone: string;
  address?: string;
  customerType: 'retail' | 'wholesale';
  creditLimit: number;
  currentBalance: number;
  loyaltyCardNumber?: string;
  loyaltyPoints: number;
  totalPurchases: number;
  createdAt: number;
  updatedAt: number;
}

// Loyalty
export interface LoyaltyCard {
  id: string;
  cardNumber: string;
  customerId: string;
  customerName: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isActive: boolean;
  createdAt: number;
}

export interface LoyaltyTransaction {
  id: string;
  cardId: string;
  customerId: string;
  type: 'earn' | 'redeem';
  points: number;
  saleId?: string;
  description: string;
  timestamp: number;
}

export interface LoyaltySettings {
  pointsPerAmount: number; // e.g., 1 point per 100 KES
  redeemPointValue: number; // e.g., 1 point = 1 KES
  minRedeemPoints: number;
  tierThresholds: {
    silver: number;
    gold: number;
    platinum: number;
  };
}

// Accounting
export interface Account {
  id: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  code: string;
  balance: number;
  description?: string;
}

export interface JournalEntry {
  id: string;
  date: number;
  description: string;
  entries: {
    accountId: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  reference?: string;
  createdAt: number;
}

export interface Expense {
  id: string;
  date: number;
  category: string;
  description: string;
  amount: number;
  paymentMethod: 'cash' | 'mpesa' | 'bank';
  reference?: string;
  vendor?: string;
  createdAt: number;
}

export interface AccountReceivable {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

export interface AccountPayable {
  id: string;
  vendorName: string;
  description: string;
  amount: number;
  amountPaid: number;
  balance: number;
  dueDate: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

// Organization Settings
export interface OrganizationSettings {
  name: string;
  phone: string;
  email?: string;
  address: string;
  kraPin: string;
  vatNumber: string;
  logo?: string;
  currency: string;
  timezone: string;
  receiptFooter: string;
  autoPrintReceipt: boolean;
  lowStockAlerts: boolean;
  darkMode: boolean;
}

export interface Terminal {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
}

export interface UnitOfMeasure {
  id: string;
  name: string;
  abbreviation: string;
}

export interface StockLocation {
  id: string;
  name: string;
  address?: string;
  isDefault: boolean;
}

// Users & Permissions
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'cashier' | 'viewer';
  isActive: boolean;
  createdAt: number;
}

export interface Permission {
  module: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

// M-pesa
export interface MpesaTransaction {
  id: string;
  transactionId: string;
  phone: string;
  amount: number;
  type: 'paybill' | 'till';
  status: 'pending' | 'completed' | 'failed';
  saleId?: string;
  timestamp: number;
}

export interface MpesaSettings {
  tillNumber?: string;
  paybillNumber?: string;
  accountNumber?: string;
  isConfigured: boolean;
}

// SMS
export interface SMSMessage {
  id: string;
  recipient: string;
  message: string;
  status: 'sent' | 'failed' | 'pending';
  timestamp: number;
}

export interface SMSSettings {
  provider?: string;
  apiKey?: string;
  senderId?: string;
  isConfigured: boolean;
}

// Dashboard
export interface DashboardStats {
  totalSales: number;
  totalTransactions: number;
  avgSale: number;
  totalItems: number;
  totalCustomers: number;
  totalReceivables: number;
  totalPayables: number;
  lowStockItems: number;
}
