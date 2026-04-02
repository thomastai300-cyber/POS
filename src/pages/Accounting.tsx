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
  CreditCard,
  Building,
  BarChart3
} from 'lucide-react';

export default function Accounting() {
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPayableModalOpen, setIsPayableModalOpen] = useState(false);
  
  const { 
    accounts, 
    expenses, 
    receivables, 
    payables, 
    addExpense, 
    addPayable,
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

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const assetAccounts = accounts.filter((a) => a.type === 'asset');
  const expenseCategories = ['Rent', 'Utilities', 'Salaries', 'Supplies', 'Transport', 'Marketing', 'Other'];

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
            <TabsTrigger value="accounts">Chart of Accounts</TabsTrigger>
          </TabsList>

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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="receivables">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Accounts Receivable</h2>
              {receivables.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <TrendingUp className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>No outstanding receivables</p>
                  <p className="text-sm">Credit sales will appear here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivables.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{r.customerName}</p>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(r.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-success">{formatKES(r.balance)}</p>
                        <Badge variant={r.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {r.status}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const amount = prompt('Enter payment amount:');
                          if (amount) recordReceivablePayment(r.id, parseFloat(amount));
                        }}
                      >
                        Record Payment
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

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
                <div className="space-y-3">
                  {payables.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-semibold">{p.vendorName}</p>
                        <p className="text-sm text-muted-foreground">{p.description}</p>
                        <p className="text-xs text-muted-foreground">
                          Due: {new Date(p.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-destructive">{formatKES(p.balance)}</p>
                        <Badge variant={p.status === 'overdue' ? 'destructive' : 'secondary'}>
                          {p.status}
                        </Badge>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          const amount = prompt('Enter payment amount:');
                          if (amount) recordPayablePayment(p.id, parseFloat(amount));
                        }}
                      >
                        Pay
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="accounts">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Chart of Accounts</h2>
              <div className="space-y-4">
                {['asset', 'liability', 'equity', 'revenue', 'expense'].map((type) => (
                  <div key={type}>
                    <h3 className="font-semibold capitalize mb-2 text-muted-foreground">{type}s</h3>
                    <div className="space-y-2">
                      {accounts.filter((a) => a.type === type).map((acc) => (
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
                ))}
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
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={expenseForm.paymentMethod} 
                  onValueChange={(v) => setExpenseForm({ ...expenseForm, paymentMethod: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vendor</Label>
                <Input
                  value={expenseForm.vendor}
                  onChange={(e) => setExpenseForm({ ...expenseForm, vendor: e.target.value })}
                  placeholder="Vendor name"
                />
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
            <DialogHeader>
              <DialogTitle>Add Payable</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Vendor Name *</Label>
                <Input
                  value={payableForm.vendorName}
                  onChange={(e) => setPayableForm({ ...payableForm, vendorName: e.target.value })}
                  placeholder="Vendor name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={payableForm.description}
                  onChange={(e) => setPayableForm({ ...payableForm, description: e.target.value })}
                  placeholder="Description"
                />
              </div>
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  min="0"
                  value={payableForm.amount}
                  onChange={(e) => setPayableForm({ ...payableForm, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={payableForm.dueDate}
                  onChange={(e) => setPayableForm({ ...payableForm, dueDate: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsPayableModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddPayable}>Add Payable</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
