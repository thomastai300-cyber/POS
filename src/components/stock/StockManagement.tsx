import { useState, useMemo } from 'react';
import { Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { StockTable } from './StockTable';
import { ItemModal } from './ItemModal';
import { BarcodePrintModal } from './BarcodePrintModal';
import { useStockStore } from '@/store/stockStore';
import { useToast } from '@/hooks/use-toast';
import { ActivityLogger } from '@/lib/activityLogger';
import type { StockItem } from '@/types';

export function StockManagement() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeItem, setBarcodeItem] = useState<StockItem | null>(null);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  
  const { items, addItem, updateItem, deleteItem } = useStockStore();
  const { toast } = useToast();

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    const lower = searchTerm.toLowerCase();
    return items.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.barcode.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }, [items, searchTerm]);

  const handleSave = (itemData: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editItem) {
      updateItem(editItem.id, itemData);
      ActivityLogger.stockUpdate(itemData.name);
      toast({
        title: 'Item Updated',
        description: `${itemData.name} has been updated successfully.`,
      });
    } else {
      addItem(itemData);
      ActivityLogger.stockCreate(itemData.name, itemData.quantity);
      toast({
        title: 'Item Added',
        description: `${itemData.name} has been added to stock.`,
      });
    }
    setEditItem(null);
  };

  const handleEdit = (item: StockItem) => {
    setEditItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (confirm(`Are you sure you want to delete "${item?.name}"?`)) {
      deleteItem(id);
      if (item) {
        ActivityLogger.stockDelete(item.name);
      }
      toast({
        title: 'Item Deleted',
        description: `${item?.name} has been removed from stock.`,
        variant: 'destructive',
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditItem(null);
  };

  const handlePrintBarcode = (item: StockItem) => {
    setBarcodeItem(item);
    setIsBarcodeModalOpen(true);
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 pb-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Stock Management</h2>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, barcode, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-input"
              />
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </div>
        </div>

        <StockTable
          items={filteredItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onPrintBarcode={handlePrintBarcode}
        />
      </div>

      <ItemModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editItem={editItem}
      />

      <BarcodePrintModal
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        item={barcodeItem}
      />
    </div>
  );
}
