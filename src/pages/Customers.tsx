import { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCustomerStore } from '@/store/customerStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { 
  Users, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  CreditCard,
  Phone,
  Mail,
  MapPin,
  Award,
  FileText
} from 'lucide-react';
import type { Customer } from '@/types';

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [showStatement, setShowStatement] = useState<Customer | null>(null);
  
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomerStore();
  const { createCard, getCardByCustomerId } = useLoyaltyStore();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    customerType: 'retail' as 'retail' | 'wholesale',
    creditLimit: '0',
  });

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const lower = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(lower) ||
        c.phone.includes(searchTerm) ||
        c.email?.toLowerCase().includes(lower)
    );
  }, [customers, searchTerm]);

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      toast({ title: 'Error', description: 'Name and phone are required', variant: 'destructive' });
      return;
    }

    if (editCustomer) {
      updateCustomer(editCustomer.id, {
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
      });
      toast({ title: 'Success', description: 'Customer updated' });
    } else {
      const newCustomer = addCustomer({
        ...formData,
        creditLimit: parseFloat(formData.creditLimit) || 0,
      });
      // Create loyalty card for new customer
      createCard(newCustomer.id, newCustomer.name);
      toast({ title: 'Success', description: 'Customer added with loyalty card' });
    }
    
    handleCloseModal();
  };

  const handleEdit = (customer: Customer) => {
    setEditCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || '',
      address: customer.address || '',
      customerType: customer.customerType,
      creditLimit: customer.creditLimit.toString(),
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) {
      deleteCustomer(id);
      toast({ title: 'Deleted', description: 'Customer removed' });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditCustomer(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      customerType: 'retail',
      creditLimit: '0',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <Users className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
                <p className="text-sm text-muted-foreground">{customers.length} customers</p>
              </div>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Customer
              </Button>
            </div>
          </div>

          {customers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No customers yet</p>
              <p className="text-sm">Add your first customer to get started</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredCustomers.map((customer) => {
                const loyaltyCard = getCardByCustomerId(customer.id);
                return (
                  <Card key={customer.id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-foreground">{customer.name}</h3>
                        <Badge variant={customer.customerType === 'wholesale' ? 'default' : 'secondary'}>
                          {customer.customerType}
                        </Badge>
                      </div>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => setShowStatement(customer)}>
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(customer)}>
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(customer.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="w-4 h-4" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          <span>{customer.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-border grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Credit Limit</p>
                        <p className="font-semibold">{formatKES(customer.creditLimit)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Balance</p>
                        <p className={`font-semibold ${customer.currentBalance > 0 ? 'text-destructive' : 'text-success'}`}>
                          {formatKES(customer.currentBalance)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Total Purchases</p>
                        <p className="font-semibold">{formatKES(customer.totalPurchases)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-primary" />
                        <div>
                          <p className="text-muted-foreground">Loyalty Points</p>
                          <p className="font-semibold">{customer.loyaltyPoints}</p>
                        </div>
                      </div>
                    </div>

                    {loyaltyCard && (
                      <div className="mt-3 p-2 bg-primary/10 rounded-lg flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-primary" />
                        <span className="text-xs font-mono">{loyaltyCard.cardNumber}</span>
                        <Badge variant="outline" className="ml-auto text-xs capitalize">
                          {loyaltyCard.tier}
                        </Badge>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Add/Edit Customer Modal */}
        <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editCustomer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Customer name"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+254 7XX XXX XXX"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Type</Label>
                  <Select
                    value={formData.customerType}
                    onValueChange={(v) => setFormData({ ...formData, customerType: v as 'retail' | 'wholesale' })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="wholesale">Wholesale</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Credit Limit</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={handleCloseModal}>Cancel</Button>
                <Button onClick={handleSave}>{editCustomer ? 'Update' : 'Add Customer'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Customer Statement Modal */}
        <Dialog open={!!showStatement} onOpenChange={() => setShowStatement(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Customer Statement - {showStatement?.name}</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Purchases</p>
                  <p className="text-2xl font-bold">{formatKES(showStatement?.totalPurchases || 0)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className={`text-2xl font-bold ${(showStatement?.currentBalance || 0) > 0 ? 'text-destructive' : 'text-success'}`}>
                    {formatKES(showStatement?.currentBalance || 0)}
                  </p>
                </div>
              </div>
              <div className="text-center text-muted-foreground py-8">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Detailed transaction history will appear here</p>
                <p className="text-sm">Enable Cloud for full statement tracking</p>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
