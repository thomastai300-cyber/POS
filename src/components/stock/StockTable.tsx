import { Edit2, Trash2, Package, AlertTriangle, Barcode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatKES } from '@/lib/currency';
import type { StockItem } from '@/types';

interface StockTableProps {
  items: StockItem[];
  onEdit: (item: StockItem) => void;
  onDelete: (id: string) => void;
  onPrintBarcode?: (item: StockItem) => void;
}

export function StockTable({ items, onEdit, onDelete, onPrintBarcode }: StockTableProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Package className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No items in stock.</p>
        <p className="text-sm">Click "Add New" to get started.</p>
      </div>
    );
  }

  const getStockStatus = (item: StockItem) => {
    if (item.quantity === 0) return 'out';
    if (item.quantity <= item.lowStockThreshold) return 'low';
    return 'ok';
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Barcode
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Cost
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Price
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Quantity
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {items.map((item) => {
            const stockStatus = getStockStatus(item);
            return (
              <tr
                key={item.id}
                className={`hover:bg-muted/30 transition-colors duration-150 ${
                  stockStatus === 'out' ? 'bg-destructive/5' : stockStatus === 'low' ? 'bg-warning/5' : ''
                }`}
              >
                <td className="px-4 py-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-lg border border-border"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-foreground font-mono">
                  {item.barcode}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-foreground">{item.name}</span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {item.category}
                </td>
                <td className="px-4 py-3 text-sm text-foreground">
                  {formatKES(item.cost)}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-foreground">
                  {formatKES(item.price)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      stockStatus === 'out' 
                        ? 'text-destructive' 
                        : stockStatus === 'low' 
                          ? 'text-warning' 
                          : 'text-foreground'
                    }`}>
                      {item.quantity}
                    </span>
                    {stockStatus === 'out' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                        <AlertTriangle className="w-3 h-3" />
                        Out
                      </span>
                    )}
                    {stockStatus === 'low' && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-warning/10 text-warning">
                        <AlertTriangle className="w-3 h-3" />
                        Low
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    {onPrintBarcode && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onPrintBarcode(item)}
                        className="h-8 px-2"
                        title="Print Barcode"
                      >
                        <Barcode className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => onEdit(item)}
                      className="h-8 px-2"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span className="hidden sm:inline ml-1">Edit</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(item.id)}
                      className="h-8 px-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span className="hidden sm:inline ml-1">Del</span>
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
