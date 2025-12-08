import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Account, JournalEntry, Expense, AccountReceivable, AccountPayable } from '@/types';

interface AccountingStore {
  accounts: Account[];
  journalEntries: JournalEntry[];
  expenses: Expense[];
  receivables: AccountReceivable[];
  payables: AccountPayable[];
  
  // Accounts
  addAccount: (account: Omit<Account, 'id' | 'balance'>) => void;
  updateAccount: (id: string, updates: Partial<Account>) => void;
  deleteAccount: (id: string) => void;
  
  // Journal Entries
  addJournalEntry: (entry: Omit<JournalEntry, 'id' | 'createdAt'>) => void;
  
  // Expenses
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  getExpensesByDateRange: (from: Date, to: Date) => Expense[];
  
  // Receivables
  addReceivable: (receivable: Omit<AccountReceivable, 'id'>) => void;
  updateReceivable: (id: string, updates: Partial<AccountReceivable>) => void;
  recordReceivablePayment: (id: string, amount: number) => void;
  
  // Payables
  addPayable: (payable: Omit<AccountPayable, 'id'>) => void;
  updatePayable: (id: string, updates: Partial<AccountPayable>) => void;
  recordPayablePayment: (id: string, amount: number) => void;
  
  // Reports
  getTotalReceivables: () => number;
  getTotalPayables: () => number;
  getTotalExpenses: (from: Date, to: Date) => number;
}

const generateId = () => Math.random().toString(36).substring(2, 15) + Date.now().toString(36);

const defaultAccounts: Omit<Account, 'id'>[] = [
  { name: 'Cash', type: 'asset', code: '1001', balance: 0 },
  { name: 'Bank', type: 'asset', code: '1002', balance: 0 },
  { name: 'Accounts Receivable', type: 'asset', code: '1100', balance: 0 },
  { name: 'Inventory', type: 'asset', code: '1200', balance: 0 },
  { name: 'Accounts Payable', type: 'liability', code: '2001', balance: 0 },
  { name: 'Sales Revenue', type: 'revenue', code: '4001', balance: 0 },
  { name: 'Cost of Goods Sold', type: 'expense', code: '5001', balance: 0 },
  { name: 'Rent Expense', type: 'expense', code: '5100', balance: 0 },
  { name: 'Utilities Expense', type: 'expense', code: '5200', balance: 0 },
  { name: 'Salaries Expense', type: 'expense', code: '5300', balance: 0 },
];

export const useAccountingStore = create<AccountingStore>()(
  persist(
    (set, get) => ({
      accounts: defaultAccounts.map((acc) => ({ ...acc, id: generateId() })),
      journalEntries: [],
      expenses: [],
      receivables: [],
      payables: [],

      addAccount: (account) => {
        const newAccount: Account = {
          ...account,
          id: generateId(),
          balance: 0,
        };
        set((state) => ({ accounts: [...state.accounts, newAccount] }));
      },

      updateAccount: (id, updates) => {
        set((state) => ({
          accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      deleteAccount: (id) => {
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
        }));
      },

      addJournalEntry: (entry) => {
        const newEntry: JournalEntry = {
          ...entry,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => {
          // Update account balances
          const updatedAccounts = state.accounts.map((acc) => {
            const entryLine = entry.entries.find((e) => e.accountId === acc.id);
            if (entryLine) {
              return {
                ...acc,
                balance: acc.balance + entryLine.debit - entryLine.credit,
              };
            }
            return acc;
          });
          return {
            journalEntries: [...state.journalEntries, newEntry],
            accounts: updatedAccounts,
          };
        });
      },

      addExpense: (expense) => {
        const newExpense: Expense = {
          ...expense,
          id: generateId(),
          createdAt: Date.now(),
        };
        set((state) => ({ expenses: [...state.expenses, newExpense] }));
      },

      updateExpense: (id, updates) => {
        set((state) => ({
          expenses: state.expenses.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      deleteExpense: (id) => {
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        }));
      },

      getExpensesByDateRange: (from, to) => {
        const fromTime = from.getTime();
        const toTime = to.getTime();
        return get().expenses.filter((e) => e.date >= fromTime && e.date <= toTime);
      },

      addReceivable: (receivable) => {
        const newReceivable: AccountReceivable = {
          ...receivable,
          id: generateId(),
        };
        set((state) => ({ receivables: [...state.receivables, newReceivable] }));
      },

      updateReceivable: (id, updates) => {
        set((state) => ({
          receivables: state.receivables.map((r) => (r.id === id ? { ...r, ...updates } : r)),
        }));
      },

      recordReceivablePayment: (id, amount) => {
        set((state) => ({
          receivables: state.receivables.map((r) => {
            if (r.id === id) {
              const newAmountPaid = r.amountPaid + amount;
              const newBalance = r.amount - newAmountPaid;
              return {
                ...r,
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : r.status,
              };
            }
            return r;
          }),
        }));
      },

      addPayable: (payable) => {
        const newPayable: AccountPayable = {
          ...payable,
          id: generateId(),
        };
        set((state) => ({ payables: [...state.payables, newPayable] }));
      },

      updatePayable: (id, updates) => {
        set((state) => ({
          payables: state.payables.map((p) => (p.id === id ? { ...p, ...updates } : p)),
        }));
      },

      recordPayablePayment: (id, amount) => {
        set((state) => ({
          payables: state.payables.map((p) => {
            if (p.id === id) {
              const newAmountPaid = p.amountPaid + amount;
              const newBalance = p.amount - newAmountPaid;
              return {
                ...p,
                amountPaid: newAmountPaid,
                balance: newBalance,
                status: newBalance <= 0 ? 'paid' : newAmountPaid > 0 ? 'partial' : p.status,
              };
            }
            return p;
          }),
        }));
      },

      getTotalReceivables: () => {
        return get().receivables.reduce((sum, r) => sum + r.balance, 0);
      },

      getTotalPayables: () => {
        return get().payables.reduce((sum, p) => sum + p.balance, 0);
      },

      getTotalExpenses: (from, to) => {
        return get()
          .getExpensesByDateRange(from, to)
          .reduce((sum, e) => sum + e.amount, 0);
      },
    }),
    { name: 'accounting-storage' }
  )
);
