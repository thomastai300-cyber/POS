import { useState, useEffect, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { StockItem } from '@/types';

interface ItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => void;
  editItem?: StockItem | null;
}

export function ItemModal({ isOpen, onClose, onSave, editItem }: ItemModalProps) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: '',
    cost: '',
    price: '',
    quantity: '',
    lowStockThreshold: '10',
    uom: 'PC',
    image: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editItem) {
      setFormData({
        barcode: editItem.barcode,
        name: editItem.name,
        category: editItem.category,
        cost: editItem.cost.toString(),
        price: editItem.price.toString(),
        quantity: editItem.quantity.toString(),
        lowStockThreshold: editItem.lowStockThreshold.toString(),
        uom: editItem.uom || 'PC',
        image: editItem.image || '',
      });
    } else {
      setFormData({
        barcode: '',
        name: '',
        category: '',
        cost: '',
        price: '',
        quantity: '',
        lowStockThreshold: '10',
        uom: 'PC',
        image: '',
      });
    }
  }, [editItem, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData((prev) => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      barcode: formData.barcode,
      name: formData.name,
      category: formData.category,
      cost: parseFloat(formData.cost),
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold) || 10,
      uom: formData.uom,
      image: formData.image || undefined,
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            {editItem ? 'Edit Item' : 'Add New Item'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label htmlFor="barcode" className="text-foreground">
              Barcode <span className="text-destructive">*</span>
            </Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, barcode: e.target.value }))
              }
              required
              className="bg-background border-input"
              placeholder="Enter barcode"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name" className="text-foreground">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
              className="bg-background border-input"
              placeholder="Enter item name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-foreground">
              Category <span className="text-destructive">*</span>
            </Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, category: e.target.value }))
              }
              required
              className="bg-background border-input"
              placeholder="Enter category"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost" className="text-foreground">
                Cost <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cost"
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cost: e.target.value }))
                }
                required
                className="bg-background border-input"
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-foreground">
                Price <span className="text-destructive">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, price: e.target.value }))
                }
                required
                className="bg-background border-input"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-foreground">
                Quantity <span className="text-destructive">*</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={formData.quantity}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quantity: e.target.value }))
                }
                required
                className="bg-background border-input"
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lowStockThreshold" className="text-foreground">
                Low Stock Alert
              </Label>
              <Input
                id="lowStockThreshold"
                type="number"
                min="0"
                value={formData.lowStockThreshold}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, lowStockThreshold: e.target.value }))
                }
                className="bg-background border-input"
                placeholder="10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Image (Optional)</Label>
            <div className="flex gap-3 items-center">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose Image
              </Button>
              {formData.image && (
                <div className="relative">
                  <img
                    src={formData.image}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-border"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, image: '' }))
                    }
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive rounded-full flex items-center justify-center"
                  >
                    <X className="w-3 h-3 text-destructive-foreground" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Item</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
