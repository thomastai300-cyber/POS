import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAccountingStore } from '@/store/accountingStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { 
  Calculator, 
  Plus, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  BarChart3,
  Trash2,
  Edit
} from 'lucide-react';

export default function Accounting() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  const [isReceivableModalOpen, setIsReceivableModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  
  const { 
    accounts, 
    expenses, 
    receivables, 
    payables, 
    journalEntries,
    addExpense, 
    addPayable,
    addReceivable,
    addAccount,
    addJournalEntry,
    deleteExpense,
    recordReceivablePayment,
    recordPayablePayment,
    getTotalReceivables,
    getTotalPayables
  } = useAccountingStore();
  const { toast } = useToast();

  const [expenseForm, setExpenseForm] = useState({
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'bank',
    vendor: '',
  });

  const [payableForm, setPayableForm] = useState({
    vendorName: '',
    description: '',
    amount: '',
    dueDate: '',
  });

  const [receivableForm, setReceivableForm] = useState({
    customerName: '',
    customerId: '',
    amount: '',
    dueDate: '',
    description: '',
  });

  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'asset' as 'asset' | 'liability' | 'equity' | 'revenue' | 'expense',
    code: '',
  });

  const [journalForm, setJournalForm] = useState({
    description: '',
    reference: '',
    debitAccountId: '',
    creditAccountId: '',
    amount: '',
  });

  const handleAddExpense = () => {
    if (!expenseForm.category || !expenseForm.amount) {
      toast({ title: 'Error', description: 'Category and amount required', variant: 'destructive' });
      return;
    }
    addExpense({
      date: Date.now(),
      category: expenseForm.category,
      description: expenseForm.description,
      amount: parseFloat(expenseForm.amount),
      paymentMethod: expenseForm.paymentMethod,
      vendor: expenseForm.vendor,
    });
    toast({ title: 'Success', description: 'Expense recorded' });
    setIsExpenseModalOpen(false);
    setExpenseForm({ category: '', description: '', amount: '', paymentMethod: 'cash', vendor: '' });
  };

  const handleAddPayable = () => {
    if (!payableForm.vendorName || !payableForm.amount) {
      toast({ title: 'Error', description: 'Vendor and amount required', variant: 'destructive' });
      return;
    }
    addPayable({
      vendorName: payableForm.vendorName,
      description: payableForm.description,
      amount: parseFloat(payableForm.amount),
      amountPaid: 0,
      balance: parseFloat(payableForm.amount),
      dueDate: payableForm.dueDate ? new Date(payableForm.dueDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: 'pending',
    });
    toast({ title: 'Success', description: 'Payable added' });
    setIsPayableModalOpen(false);
    setPayableForm({ vendorName: '', description: '', amount: '', dueDate: '' });
  };

  const handleAddReceivable = () => {
    if (!receivableForm.customerName || !receivableForm.amount) {
      toast({ title: 'Error', description: 'Customer name and amount required', variant: 'destructive' });
      return;
    }
    addReceivable({
      customerId: receivableForm.customerId || receivableForm.customerName.toLowerCase().replace(/\s/g, '-'),
      customerName: receivableForm.customerName,
      amount: parseFloat(receivableForm.amount),
      amountPaid: 0,
      balance: parseFloat(receivableForm.amount),
      dueDate: receivableForm.dueDate ? new Date(receivableForm.dueDate).getTime() : Date.now() + 30 * 24 * 60 * 60 * 1000,
      status: 'pending',
    });
    toast({ title: 'Success', description: 'Receivable added' });
    setIsReceivableModalOpen(false);
    setReceivableForm({ customerName: '', customerId: '', amount: '', dueDate: '', description: '' });
  };

  const handleAddAccount = () => {
    if (!accountForm.name || !accountForm.code) {
      toast({ title: 'Error', description: 'Name and code required', variant: 'destructive' });
      return;
    }
    addAccount({
      name: accountForm.name,
      type: accountForm.type,
      code: accountForm.code,
    });
    toast({ title: 'Success', description: 'Account added to chart' });
    setIsAccountModalOpen(false);
    setAccountForm({ name: '', type: 'asset', code: '' });
  };

  const handleAddJournalEntry = () => {
    if (!journalForm.description || !journalForm.amount || !journalForm.debitAccountId || !journalForm.creditAccountId) {
      toast({ title: 'Error', description: 'All fields required', variant: 'destructive' });
      return;
    }
    const debitAcc = accounts.find(a => a.id === journalForm.debitAccountId);
    const creditAcc = accounts.find(a => a.id === journalForm.creditAccountId);
    if (!debitAcc || !creditAcc) return;

    addJournalEntry({
      date: Date.now(),
      description: journalForm.description,
      reference: journalForm.reference,
      entries: [
        { accountId: debitAcc.id, accountName: debitAcc.name, debit: parseFloat(journalForm.amount), credit: 0 },
        { accountId: creditAcc.id, accountName: creditAcc.name, debit: 0, credit: parseFloat(journalForm.amount) },
      ],
    });
    toast({ title: 'Success', description: 'Journal entry recorded' });
    setIsJournalModalOpen(false);
    setJournalForm({ description: '', reference: '', debitAccountId: '', creditAccountId: '', amount: '' });
  };

  const handleRecordPayment = (type: 'receivable' | 'payable', id: string) => {
    const amount = prompt('Enter payment amount:');
    if (!amount || isNaN(parseFloat(amount))) return;
    if (type === 'receivable') {
      recordReceivablePayment(id, parseFloat(amount));
    } else {
      recordPayablePayment(id, parseFloat(amount));
    }
    toast({ title: 'Payment Recorded', description: `${formatKES(parseFloat(amount))} payment recorded` });
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Transport', 'Marketing', 'Insurance', 'Maintenance', 'Other'];

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
            <Calculator className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Accounting</h1>
            <p className="text-muted-foreground">Manage finances and reports</p>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Receivables</p>
                <p className="text-2xl font-bold text-success">{formatKES(getTotalReceivables())}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-destructive/10 rounded-lg">
                <TrendingDown className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payables</p>
                <p className="text-2xl font-bold text-destructive">{formatKES(getTotalPayables())}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-lg">
                <Wallet className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold">{formatKES(totalExpenses)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Net Position</p>
                <p className="text-2xl font-bold">{formatKES(getTotalReceivables() - getTotalPayables())}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="expenses" className="space-y-4">
          <TabsList>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="receivables">Receivables</TabsTrigger>
            <TabsTrigger value="payables">Payables</TabsTrigger>
            <TabsTrigger value="journal">Journal Entries</TabsTrigger>
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          </TabsList>

          {/* Expenses Tab */}
          <TabsContent value="expenses">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Expenses</h2>
                <Button onClick={() => setIsExpenseModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Expense
                </Button>
              </div>

              {expenses.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Wallet className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No expenses recorded</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Date</th>
                        <th className="text-left py-3 px-2">Category</th>
                        <th className="text-left py-3 px-2">Description</th>
                        <th className="text-left py-3 px-2">Vendor</th>
                        <th className="text-left py-3 px-2">Method</th>
                        <th className="text-right py-3 px-2">Amount</th>
                        <th className="text-right py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.slice().reverse().map((expense) => (
                        <tr key={expense.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 text-sm">
                            {new Date(expense.date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2">
                            <Badge variant="secondary">{expense.category}</Badge>
                          </td>
                          <td className="py-3 px-2 text-sm">{expense.description || '-'}</td>
                          <td className="py-3 px-2 text-sm">{expense.vendor || '-'}</td>
                          <td className="py-3 px-2 text-sm capitalize">{expense.paymentMethod}</td>
                          <td className="py-3 px-2 text-right font-semibold text-destructive">
                            {formatKES(expense.amount)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <Button size="icon" variant="ghost" onClick={() => deleteExpense(expense.id)}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Receivables Tab */}
          <TabsContent value="receivables">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Accounts Receivable</h2>
                <Button onClick={() => setIsReceivableModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Receivable
                </Button>
              </div>
              {receivables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No outstanding receivables</p>
                  <p className="text-sm">Credit sales will appear here</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Customer</th>
                        <th className="text-right py-3 px-2">Total</th>
                        <th className="text-right py-3 px-2">Paid</th>
                        <th className="text-right py-3 px-2">Balance</th>
                        <th className="text-left py-3 px-2">Due Date</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-right py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {receivables.map((r) => (
                        <tr key={r.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{r.customerName}</td>
                          <td className="py-3 px-2 text-right">{formatKES(r.amount)}</td>
                          <td className="py-3 px-2 text-right text-success">{formatKES(r.amountPaid)}</td>
                          <td className="py-3 px-2 text-right font-semibold">{formatKES(r.balance)}</td>
                          <td className="py-3 px-2 text-sm">{new Date(r.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <Badge variant={r.status === 'overdue' ? 'destructive' : r.status === 'paid' ? 'default' : 'secondary'}>
                              {r.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {r.status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => handleRecordPayment('receivable', r.id)}>
                                Record Payment
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Payables Tab */}
          <TabsContent value="payables">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Accounts Payable</h2>
                <Button onClick={() => setIsPayableModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payable
                </Button>
              </div>
              {payables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingDown className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No outstanding payables</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Vendor</th>
                        <th className="text-left py-3 px-2">Description</th>
                        <th className="text-right py-3 px-2">Total</th>
                        <th className="text-right py-3 px-2">Paid</th>
                        <th className="text-right py-3 px-2">Balance</th>
                        <th className="text-left py-3 px-2">Due Date</th>
                        <th className="text-left py-3 px-2">Status</th>
                        <th className="text-right py-3 px-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payables.map((p) => (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-2 font-medium">{p.vendorName}</td>
                          <td className="py-3 px-2 text-sm">{p.description}</td>
                          <td className="py-3 px-2 text-right">{formatKES(p.amount)}</td>
                          <td className="py-3 px-2 text-right text-success">{formatKES(p.amountPaid)}</td>
                          <td className="py-3 px-2 text-right font-semibold text-destructive">{formatKES(p.balance)}</td>
                          <td className="py-3 px-2 text-sm">{new Date(p.dueDate).toLocaleDateString()}</td>
                          <td className="py-3 px-2">
                            <Badge variant={p.status === 'overdue' ? 'destructive' : p.status === 'paid' ? 'default' : 'secondary'}>
                              {p.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-2 text-right">
                            {p.status !== 'paid' && (
                              <Button size="sm" variant="outline" onClick={() => handleRecordPayment('payable', p.id)}>
                                Pay
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Journal Entries Tab */}
          <TabsContent value="journal">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Journal Entries</h2>
                <Button onClick={() => setIsJournalModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Entry
                </Button>
              </div>
              {journalEntries.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No journal entries</p>
                  <p className="text-sm">Record double-entry transactions here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {journalEntries.slice().reverse().map((entry) => (
                    <div key={entry.id} className="p-4 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold">{entry.description}</p>
                          {entry.reference && <p className="text-xs text-muted-foreground">Ref: {entry.reference}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleDateString()}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mt-2">
                        <div className="font-medium text-muted-foreground">Account</div>
                        <div className="text-right font-medium text-muted-foreground">Debit</div>
                        <div className="text-right font-medium text-muted-foreground">Credit</div>
                        {entry.entries.map((line, idx) => (
                          <div key={idx} className="contents">
                            <div>{line.accountName}</div>
                            <div className="text-right">{line.debit > 0 ? formatKES(line.debit) : '-'}</div>
                            <div className="text-right">{line.credit > 0 ? formatKES(line.credit) : '-'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Chart of Accounts Tab */}
          <TabsContent value="accounts">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Chart of Accounts</h2>
                <Button onClick={() => setIsAccountModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Account
                </Button>
              </div>
              <div className="space-y-4">
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => {
                  const typeAccounts = accounts.filter((a) => a.type === type);
                  if (typeAccounts.length === 0) return null;
                  return (
                    <div key={type}>
                      <h3 className="font-semibold capitalize mb-2 text-muted-foreground">{type}s</h3>
                      <div className="space-y-2">
                        {typeAccounts.map((acc) => (
                          <div key={acc.id} className="flex justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-sm text-muted-foreground">{acc.code}</span>
                              <span>{acc.name}</span>
                            </div>
                            <span className={`font-semibold ${acc.balance >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                              {formatKES(Math.abs(acc.balance))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Expense Modal */}
        <Dialog open={isExpenseModalOpen} onOpenChange={setIsExpenseModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={expenseForm.category} onValueChange={(v) => setExpenseForm({ ...expenseForm, category: v })}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} placeholder="Description" />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={expenseForm.paymentMethod} onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentMethod: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input value={expenseForm.vendor} onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })} placeholder="Vendor name" />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Payable Modal */}
        <Dialog open={isPayableModalOpen} onOpenChange={setIsPayableModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Payable</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input value={payableForm.vendorName} onChange={(e) => setPayableForm({ ...payableForm, vendorName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={payableForm.description} onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" value={payableForm.amount} onChange={(e) => setPayableForm({ ...payableForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={payableForm.dueDate} onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsPayableModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPayable}>Add Payable</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Receivable Modal */}
        <Dialog open={isReceivableModalOpen} onOpenChange={setIsReceivableModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Receivable</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={receivableForm.customerName} onChange={(e) => setReceivableForm({ ...receivableForm, customerName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" value={receivableForm.amount} onChange={(e) => setReceivableForm({ ...receivableForm, amount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" value={receivableForm.dueDate} onChange={(e) => setReceivableForm({ ...receivableForm, dueDate: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsReceivableModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddReceivable}>Add Receivable</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Account Modal */}
        <Dialog open={isAccountModalOpen} onOpenChange={setIsAccountModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Account</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Account Name *</Label>
                <Input value={accountForm.name} onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })} placeholder="e.g. Petty Cash" />
              </div>
              <div className="space-y-2">
                <Label>Account Code *</Label>
                <Input value={accountForm.code} onChange={(e) => setAccountForm({ ...accountForm, code: e.target.value })} placeholder="e.g. 1003" />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={accountForm.type} onValueChange={(v) => setAccountForm({ ...accountForm, type: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asset">Asset</SelectItem>
                    <SelectItem value="liability">Liability</SelectItem>
                    <SelectItem value="equity">Equity</SelectItem>
                    <SelectItem value="revenue">Revenue</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsAccountModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddAccount}>Add Account</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Journal Entry Modal */}
        <Dialog open={isJournalModalOpen} onOpenChange={setIsJournalModalOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>New Journal Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Description *</Label>
                <Input value={journalForm.description} onChange={(e) => setJournalForm({ ...journalForm, description: e.target.value })} placeholder="Transaction description" />
              </div>
              <div className="space-y-2">
                <Label>Reference</Label>
                <Input value={journalForm.reference} onChange={(e) => setJournalForm({ ...journalForm, reference: e.target.value })} placeholder="e.g. INV-001" />
              </div>
              <div className="space-y-2">
                <Label>Debit Account *</Label>
                <Select value={journalForm.debitAccountId} onValueChange={(v) => setJournalForm({ ...journalForm, debitAccountId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Account *</Label>
                <Select value={journalForm.creditAccountId} onValueChange={(v) => setJournalForm({ ...journalForm, creditAccountId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>{a.code} - {a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input type="number" min="0" value={journalForm.amount} onChange={(e) => setJournalForm({ ...journalForm, amount: e.target.value })} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsJournalModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddJournalEntry}>Record Entry</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
