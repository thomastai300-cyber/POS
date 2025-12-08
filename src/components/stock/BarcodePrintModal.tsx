import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarcodeLabel } from './BarcodeLabel';
import type { StockItem } from '@/types';

interface BarcodePrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: StockItem | null;
}

export function BarcodePrintModal({ isOpen, onClose, item }: BarcodePrintModalProps) {
  const [quantity, setQuantity] = useState(1);

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Print Barcode Labels</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Product</p>
            <p className="font-medium text-foreground">{item.name}</p>
            <p className="text-sm font-mono text-muted-foreground">{item.barcode}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quantity">Number of Labels</Label>
            <Input 
              id="quantity"
              type="number"
              min={1}
              max={100}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
          </div>
          
          <div className="flex justify-center pt-2">
            <BarcodeLabel item={item} quantity={quantity} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
