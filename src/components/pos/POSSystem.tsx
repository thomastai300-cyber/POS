import { useState, useMemo, useRef, useCallback } from 'react';
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
  ScanBarcode
} from 'lucide-react';
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useStockStore } from '@/store/stockStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { ActivityLogger } from '@/lib/activityLogger';
import { ETRReceipt } from './ETRReceipt';
import type { StockItem, SaleItem, Sale } from '@/types';

interface CartItem extends SaleItem {
  item: StockItem;
}

export function POSSystem() {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState('0');
  const [cashReceived, setCashReceived] = useState('');
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  
  const receiptRef = useRef<HTMLDivElement>(null);
  const { items, addSale } = useStockStore();
  const { toast } = useToast();

  // Barcode scanner integration
  const handleBarcodeScan = useCallback(
    (barcode: string) => {
      const item = items.find(
        (i) => i.barcode.toLowerCase() === barcode.toLowerCase()
      );
      if (item) {
        addToCart(item);
        toast({
          title: 'Item Added',
          description: `${item.name} scanned and added to cart`,
        });
      } else {
        toast({
          title: 'Product Not Found',
          description: `No product found with barcode: ${barcode}`,
          variant: 'destructive',
        });
      }
    },
    [items, toast]
  );

  useBarcodeScanner({ onScan: handleBarcodeScan });

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.barcode.toLowerCase().includes(lower)
    );
  }, [items, searchTerm]);

  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total, 0);
  }, [cart]);

  const discountAmount = parseFloat(discount) || 0;
  const total = subtotal - discountAmount;
  const cashAmount = parseFloat(cashReceived) || 0;
  const balance = cashAmount - total;

  const addToCart = (item: StockItem) => {
    // Check if item is in stock
    if (item.quantity <= 0) {
      toast({
        title: 'Out of Stock',
        description: `${item.name} is currently out of stock.`,
        variant: 'destructive',
      });
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      const currentCartQty = existing?.quantity || 0;
      
      // Check if adding one more would exceed available stock
      if (currentCartQty >= item.quantity) {
        toast({
          title: 'Insufficient Stock',
          description: `Only ${item.quantity} ${item.name} available.`,
          variant: 'destructive',
        });
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
            // Check stock limit when increasing
            if (delta > 0 && item && newQty > item.quantity) {
              toast({
                title: 'Insufficient Stock',
                description: `Only ${item.quantity} ${item.name} available.`,
                variant: 'destructive',
              });
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
  };

  const generateReceiptNumber = () => {
    const date = new Date();
    const prefix = 'RNG';
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}${dateStr}${random}`;
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: 'Empty Cart',
        description: 'Please add items to the cart first.',
        variant: 'destructive',
      });
      return;
    }

    if (cashAmount < total) {
      toast({
        title: 'Insufficient Cash',
        description: 'Cash received is less than the total amount.',
        variant: 'destructive',
      });
      return;
    }

    const newReceiptNumber = generateReceiptNumber();
    
    const sale: Omit<Sale, 'id'> & { id?: string } = {
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0],
      saleType: 'retail',
      totalItems: cart.reduce((sum, c) => sum + c.quantity, 0),
      subtotal,
      discount: discountAmount,
      tax: 0,
      total,
      amountPaid: cashAmount,
      balance,
      paymentMethod: 'cash',
      items: cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        total: c.total,
      })),
      status: 'completed',
    };

    const completedSale = addSale(sale as Omit<Sale, 'id'>);
    
    // Log the sale activity
    ActivityLogger.sale(
      completedSale.id, 
      total, 
      cart.reduce((sum, c) => sum + c.quantity, 0)
    );
    
    // Set the last sale for receipt display
    setLastSale(completedSale);
    setReceiptNumber(newReceiptNumber);
    setShowReceipt(true);
    
    toast({
      title: 'Sale Complete!',
      description: `Transaction successful. Change: ${formatKES(balance)}`,
    });

    clearCart();
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
                body { 
                  font-family: 'Courier New', Courier, monospace; 
                  padding: 10px;
                  font-size: 12px;
                  background: white;
                  color: black;
                }
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
                .py-0\\.5 { padding-top: 0.125rem; padding-bottom: 0.125rem; }
                .border-b { border-bottom: 1px dashed #999; }
                .border-dashed { border-style: dashed; }
                .border-gray-400 { border-color: #999; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .w-24 { width: 6rem; }
                .w-16 { width: 4rem; }
                .w-8 { width: 2rem; }
                .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .max-w-\\[300px\\] { max-width: 300px; }
                .mx-auto { margin-left: auto; margin-right: auto; }
                .text-\\[10px\\] { font-size: 10px; }
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

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>

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
            <div className="flex items-center gap-3 mb-6">
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

            {cart.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Cart is empty</p>
                <p className="text-xs">Click products to add them</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
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

              <div className="flex justify-between text-lg font-bold border-t border-border pt-3">
                <span className="text-foreground">Total</span>
                <span className="text-primary">{formatKES(total)}</span>
              </div>

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

              {cashAmount > 0 && (
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
                  disabled={cart.length === 0 || cashAmount < total}
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
