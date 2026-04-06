import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Package,
  Receipt,
  Printer,
  X,
  ScanBarcode,
  Award,
  User,
  Smartphone,
  Banknote,
  Sparkles,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStockStore } from '@/store/stockStore';
import { useCustomerStore } from '@/store/customerStore';
import { useLoyaltyStore } from '@/store/loyaltyStore';
import { useSettingsStore } from '@/store/settingsStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { ActivityLogger } from '@/lib/activityLogger';
import { ETRReceipt } from './ETRReceipt';
import type { StockItem, SaleItem, Sale } from '@/types';

interface CartItem extends SaleItem {
  item: StockItem;
}

type PaymentMethod = 'cash' | 'mpesa' | 'mixed';

export function POSSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [cashReceived, setCashReceived] = useState('');
  const [mpesaAmount, setMpesaAmount] = useState('');
  const [mpesaRef, setMpesaRef] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [loyaltyPointsToRedeem, setLoyaltyPointsToRedeem] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResults, setAiResults] = useState<string[] | null>(null);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { items, addSale, fetchItems } = useStockStore();
  const { customers, recordPurchase, addLoyaltyPoints } = useCustomerStore();
  const { getCardByCustomerId, earnPoints, redeemPoints } = useLoyaltyStore();
  const { loyaltySettings } = useSettingsStore();
  const { toast } = useToast();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const item = items.find(
        (i) => i.barcode.toLowerCase() === barcode.toLowerCase()
      );
      if (item) {
        addToCart(item);
        toast({ title: 'Item Added', description: `${item.name} scanned and added to cart` });
      } else {
        toast({ title: 'Product Not Found', description: `No product found with barcode: ${barcode}`, variant: 'destructive' });
      }
    },
    [items, toast]
  );

  useBarcodeScanner({ onScan: handleBarcodeScan });

  const handleAiSearch = useCallback(async (query: string) => {
    if (!query || query.length < 3 || items.length === 0) {
      setAiResults(null);
      return;
    }
    setAiSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-search', {
        body: { 
          query, 
          products: items.map(i => ({ id: i.id, name: i.name, category: i.category, price: i.price, barcode: i.barcode }))
        }
      });
      if (error) throw error;
      setAiResults(data?.product_ids || []);
    } catch {
      setAiResults(null);
    } finally {
      setAiSearching(false);
    }
  }, [items]);

  const filteredItems = useMemo(() => {
    if (aiResults !== null) {
      return aiResults.map(id => items.find(i => i.id === id)).filter(Boolean) as typeof items;
    }
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.barcode.toLowerCase().includes(lower)
    );
  }, [items, searchTerm, aiResults]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const discountAmount = (parseFloat(discount) || 0) + loyaltyDiscount;
  const total = subtotal - discountAmount;
  const cashAmount = parseFloat(cashReceived) || 0;
  const mpesaPaid = parseFloat(mpesaAmount) || 0;
  
  const totalPaid = paymentMethod === 'cash' ? cashAmount 
    : paymentMethod === 'mpesa' ? mpesaPaid 
    : cashAmount + mpesaPaid;
  const balance = totalPaid - total;

  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) : null;
  const selectedLoyaltyCard = selectedCustomerId ? getCardByCustomerId(selectedCustomerId) : null;
  const pointsToEarn = Math.floor(total / loyaltySettings.pointsPerAmount);

  const handleRedeemLoyaltyPoints = () => {
    if (!selectedLoyaltyCard) return;
    const pts = parseInt(loyaltyPointsToRedeem) || 0;
    if (pts < loyaltySettings.minRedeemPoints) {
      toast({ title: 'Error', description: `Minimum ${loyaltySettings.minRedeemPoints} points required`, variant: 'destructive' });
      return;
    }
    if (pts > selectedLoyaltyCard.points) {
      toast({ title: 'Error', description: 'Insufficient loyalty points', variant: 'destructive' });
      return;
    }
    const discountValue = pts * loyaltySettings.redeemPointValue;
    setLoyaltyDiscount(discountValue);
    toast({ title: 'Loyalty Discount Applied', description: `${pts} points = ${formatKES(discountValue)} discount` });
  };

  const clearLoyaltyDiscount = () => {
    setLoyaltyDiscount(0);
    setLoyaltyPointsToRedeem('');
  };

  const addToCart = (item: StockItem) => {
    if (item.quantity <= 0) {
      toast({ title: 'Out of Stock', description: `${item.name} is currently out of stock.`, variant: 'destructive' });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      const currentCartQty = existing?.quantity || 0;
      
      if (currentCartQty >= item.quantity) {
        toast({ title: 'Insufficient Stock', description: `Only ${item.quantity} ${item.name} available.`, variant: 'destructive' });
        return prev;
      }

      if (existing) {
        return prev.map((c) =>
          c.itemId === item.id
            ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.price }
            : c
        );
      }
      return [
        ...prev,
        {
          itemId: item.id,
          name: item.name,
          quantity: 1,
          price: item.price,
          total: item.price,
          item,
        },
      ];
    });
  };

  const getAvailableStock = (itemId: string) => {
    const item = items.find((i) => i.id === itemId);
    const cartItem = cart.find((c) => c.itemId === itemId);
    const inCart = cartItem?.quantity || 0;
    return (item?.quantity || 0) - inCart;
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const item = items.find((i) => i.id === itemId);
    
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.itemId === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (delta > 0 && item && newQty > item.quantity) {
              toast({ title: 'Insufficient Stock', description: `Only ${item.quantity} ${item.name} available.`, variant: 'destructive' });
              return c;
            }
            return { ...c, quantity: newQty, total: newQty * c.price };
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount('0');
    setCashReceived('');
    setMpesaAmount('');
    setMpesaRef('');
    setPaymentMethod('cash');
    setSelectedCustomerId('');
    setLoyaltyDiscount(0);
    setLoyaltyPointsToRedeem('');
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = 'RNG';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${dateStr}${random}`;
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'Empty Cart', description: 'Please add items to the cart first.', variant: 'destructive' });
      return;
    }

    if (paymentMethod === 'mpesa' && !mpesaRef.trim()) {
      toast({ title: 'M-Pesa Reference Required', description: 'Enter the M-Pesa transaction reference code.', variant: 'destructive' });
      return;
    }

    if (totalPaid < total) {
      toast({ title: 'Insufficient Payment', description: 'Amount paid is less than the total.', variant: 'destructive' });
      return;
    }

    const newReceiptNumber = generateReceiptNumber();
    const loyaltyPointsRedeemedCount = loyaltyDiscount > 0 ? Math.round(loyaltyDiscount / loyaltySettings.redeemPointValue) : 0;
    
    const salePaymentMethod = paymentMethod === 'mixed' ? 'mixed' : paymentMethod;

    const sale: Omit<Sale, 'id'> & { id?: string } = {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomerId || undefined,
      customerName: selectedCustomer?.name,
      saleType: selectedCustomer?.customerType || 'retail',
      totalItems: cart.reduce((sum, c) => sum + c.quantity, 0),
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      amountPaid: totalPaid,
      balance,
      paymentMethod: salePaymentMethod as any,
      mpesaRef: paymentMethod !== 'cash' ? mpesaRef : undefined,
      loyaltyPointsEarned: pointsToEarn,
      loyaltyPointsRedeemed: loyaltyPointsRedeemedCount,
      items: cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        total: c.total,
      })),
      status: 'completed',
    };

    try {
      const completedSale = await addSale(sale as Omit<Sale, 'id'>);
      
      ActivityLogger.sale(
        completedSale.id, 
        total, 
        cart.reduce((sum, c) => sum + c.quantity, 0)
      );

      if (selectedCustomerId && selectedLoyaltyCard) {
        if (loyaltyPointsRedeemedCount > 0) {
          redeemPoints(selectedLoyaltyCard.id, selectedCustomerId, loyaltyPointsRedeemedCount, `Redeemed at POS - Sale #${completedSale.id.slice(-6)}`);
        }
        if (pointsToEarn > 0) {
          earnPoints(selectedLoyaltyCard.id, selectedCustomerId, pointsToEarn, completedSale.id);
          addLoyaltyPoints(selectedCustomerId, pointsToEarn);
        }
        recordPurchase(selectedCustomerId, total);
      }
      
      setLastSale(completedSale);
      setReceiptNumber(newReceiptNumber);
      setShowReceipt(true);
      
      toast({
        title: 'Sale Complete!',
        description: `Transaction successful via ${paymentMethod.toUpperCase()}. Change: ${formatKES(balance)}${pointsToEarn > 0 ? ` | +${pointsToEarn} loyalty pts` : ''}`,
      });

      clearCart();
    } catch (error: any) {
      toast({
        title: 'Sale Failed',
        description: error.message || 'Could not process sale.',
        variant: 'destructive',
      });
    }
  };

  const handlePrintReceipt = () => {
    if (receiptRef.current) {
      const printContent = receiptRef.current.innerHTML;
      const printWindow = window.open('', '', 'width=400,height=600');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>ETR Receipt - ${receiptNumber}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Courier New', Courier, monospace; padding: 10px; font-size: 12px; background: white; color: black; }
                .bg-white { background: white; }
                .text-black { color: black; }
                .p-6 { padding: 1.5rem; }
                .font-mono { font-family: 'Courier New', Courier, monospace; }
                .text-xs { font-size: 10px; }
                .text-sm { font-size: 12px; }
                .text-lg { font-size: 16px; font-weight: bold; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .font-bold { font-weight: bold; }
                .mb-1 { margin-bottom: 0.25rem; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-3 { margin-bottom: 0.75rem; }
                .mt-1 { margin-top: 0.25rem; }
                .mt-2 { margin-top: 0.5rem; }
                .mt-3 { margin-top: 0.75rem; }
                .pb-3 { padding-bottom: 0.75rem; }
                .border-b { border-bottom: 1px dashed #999; }
                .border-dashed { border-style: dashed; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .w-24 { width: 6rem; }
                .w-16 { width: 4rem; }
                .w-8 { width: 2rem; }
                .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .max-w-\\[300px\\] { max-width: 300px; }
                .mx-auto { margin-left: auto; margin-right: auto; }
              </style>
            </head>
            <body>${printContent}</body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Product Selection */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-2xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Point of Sale</h2>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm">
                <ScanBarcode className="w-4 h-4" />
                <span className="hidden sm:inline">Scanner Ready</span>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!e.target.value) setAiResults(null);
                  }}
                  className="pl-10 bg-background border-input"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className={`shrink-0 ${aiResults !== null ? 'bg-primary text-primary-foreground' : ''}`}
                disabled={aiSearching || !searchTerm}
                onClick={() => {
                  if (aiResults !== null) {
                    setAiResults(null);
                  } else {
                    handleAiSearch(searchTerm);
                  }
                }}
                title="AI Smart Search"
              >
                {aiSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </Button>
            </div>
            {aiResults !== null && (
              <div className="flex items-center gap-2 mb-3 text-xs text-primary">
                <Sparkles className="w-3 h-3" />
                <span>AI found {aiResults.length} matching product{aiResults.length !== 1 ? 's' : ''}</span>
                <button onClick={() => setAiResults(null)} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No products available</p>
                <p className="text-sm">Add products in Stock Management first.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {filteredItems.map((item) => {
                  const availableStock = getAvailableStock(item.id);
                  const isOutOfStock = item.quantity <= 0;
                  const isLowStock = item.quantity <= item.lowStockThreshold && item.quantity > 0;
                  
                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={isOutOfStock}
                      className={`p-4 rounded-xl transition-all duration-200 text-left group relative ${
                        isOutOfStock 
                          ? 'bg-muted/30 opacity-60 cursor-not-allowed' 
                          : 'bg-muted/50 hover:bg-muted hover:shadow-md hover:-translate-y-0.5'
                      }`}
                    >
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-full h-20 object-cover rounded-lg mb-2"
                        />
                      ) : (
                        <div className="w-full h-20 bg-secondary rounded-lg mb-2 flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                      <p className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-primary font-bold">{formatKES(item.price)}</p>
                      <div className={`text-xs mt-1 ${
                        isOutOfStock 
                          ? 'text-destructive font-semibold' 
                          : isLowStock 
                            ? 'text-warning' 
                            : 'text-muted-foreground'
                      }`}>
                        {isOutOfStock ? 'Out of stock' : `${availableStock} left`}
                      </div>
                      {isOutOfStock && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-xl">
                          <span className="text-destructive font-bold text-sm">OUT OF STOCK</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl shadow-card p-6 sticky top-24">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground">Cart</h3>
              {cart.length > 0 && (
                <span className="ml-auto px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {cart.reduce((sum, c) => sum + c.quantity, 0)} items
                </span>
              )}
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <Label className="text-xs text-muted-foreground mb-1 block">Customer (optional)</Label>
              <Select value={selectedCustomerId} onValueChange={(v) => { setSelectedCustomerId(v === 'none' ? '' : v); clearLoyaltyDiscount(); }}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Walk-in customer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Walk-in customer</SelectItem>
                  {customers.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <User className="w-3 h-3" />
                        {c.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedLoyaltyCard && (
                <div className="mt-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 text-xs">
                    <Award className="w-3.5 h-3.5 text-primary" />
                    <span className="font-medium text-primary">{selectedLoyaltyCard.points} pts</span>
                    <Badge variant="outline" className="text-[10px] capitalize ml-auto">{selectedLoyaltyCard.tier}</Badge>
                  </div>
                  {selectedLoyaltyCard.points >= loyaltySettings.minRedeemPoints && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <Input
                        type="number"
                        placeholder="Points"
                        value={loyaltyPointsToRedeem}
                        onChange={(e) => setLoyaltyPointsToRedeem(e.target.value)}
                        className="h-7 text-xs flex-1"
                        min={loyaltySettings.minRedeemPoints}
                        max={selectedLoyaltyCard.points}
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleRedeemLoyaltyPoints}>
                        Redeem
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Click products to add them</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-48 overflow-y-auto mb-4">
                {cart.map((item) => (
                  <div
                    key={item.itemId}
                    className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatKES(item.price)} each
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.itemId, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-8 text-center font-semibold text-foreground">
                        {item.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.itemId, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="font-semibold text-foreground w-20 text-right">
                      {formatKES(item.total)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      onClick={() => removeFromCart(item.itemId)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-border pt-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold text-foreground">{formatKES(subtotal)}</span>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm text-muted-foreground w-20">Discount</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="h-8 bg-background border-input"
                />
              </div>

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-primary flex items-center gap-1">
                    <Award className="w-3 h-3" /> Loyalty
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-primary">-{formatKES(loyaltyDiscount)}</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" onClick={clearLoyaltyDiscount}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatKES(total)}</span>
              </div>

              {selectedCustomerId && pointsToEarn > 0 && (
                <div className="flex items-center gap-1 text-xs text-primary">
                  <Award className="w-3 h-3" />
                  <span>Customer earns +{pointsToEarn} loyalty points</span>
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                    className="h-9 text-xs"
                    onClick={() => setPaymentMethod('cash')}
                  >
                    <Banknote className="w-3.5 h-3.5 mr-1" />
                    Cash
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === 'mpesa' ? 'default' : 'outline'}
                    className="h-9 text-xs"
                    onClick={() => setPaymentMethod('mpesa')}
                  >
                    <Smartphone className="w-3.5 h-3.5 mr-1" />
                    M-Pesa
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={paymentMethod === 'mixed' ? 'default' : 'outline'}
                    className="h-9 text-xs"
                    onClick={() => setPaymentMethod('mixed')}
                  >
                    <CreditCard className="w-3.5 h-3.5 mr-1" />
                    Split
                  </Button>
                </div>
              </div>

              {/* Cash Input */}
              {(paymentMethod === 'cash' || paymentMethod === 'mixed') && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-muted-foreground w-20">Cash</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0.00"
                    className="h-8 bg-background border-input"
                  />
                </div>
              )}

              {/* M-Pesa Inputs */}
              {(paymentMethod === 'mpesa' || paymentMethod === 'mixed') && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground w-20">M-Pesa</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mpesaAmount}
                      onChange={(e) => setMpesaAmount(e.target.value)}
                      placeholder="0.00"
                      className="h-8 bg-background border-input"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-sm text-muted-foreground w-20">Ref Code</Label>
                    <Input
                      value={mpesaRef}
                      onChange={(e) => setMpesaRef(e.target.value.toUpperCase())}
                      placeholder="e.g. SHK12AB3CD"
                      className="h-8 bg-background border-input font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {totalPaid > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Change</span>
                  <span className={`font-semibold ${balance >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {formatKES(balance)}
                  </span>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  Clear
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || totalPaid < total}
                >
                  <Receipt className="w-4 h-4 mr-2" />
                  Checkout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ETR Receipt Modal */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              ETR Receipt
            </DialogTitle>
          </DialogHeader>
          
          {lastSale && (
            <>
              <div ref={receiptRef}>
                <ETRReceipt sale={lastSale} receiptNumber={receiptNumber} />
              </div>
              
              <div className="flex gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => setShowReceipt(false)}
                >
                  <X className="w-4 h-4 mr-2" />
                  Close
                </Button>
                <Button
                  className="flex-1"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
