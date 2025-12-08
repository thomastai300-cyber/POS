import { Receipt } from 'lucide-react';
import { formatKES } from '@/lib/currency';
import type { Sale } from '@/types';

interface SalesTableProps {
  sales: Sale[];
}

export function SalesTable({ sales }: SalesTableProps) {
  if (sales.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Receipt className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">No sales data available</p>
        <p className="text-sm">Sales will appear here once transactions are made.</p>
      </div>
    );
  }

  const totals = sales.reduce(
    (acc, sale) => ({
      items: acc.items + sale.totalItems,
      subtotal: acc.subtotal + sale.subtotal,
      discount: acc.discount + sale.discount,
      total: acc.total + sale.total,
      amountPaid: acc.amountPaid + sale.amountPaid,
      balance: acc.balance + sale.balance,
    }),
    { items: 0, subtotal: 0, discount: 0, total: 0, amountPaid: 0, balance: 0 }
  );

  return (
    <div className="overflow-x-auto border border-border rounded-xl">
      <table className="w-full" id="salesTable">
        <thead>
          <tr className="bg-muted/50">
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Date & Time
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Transaction ID
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Subtotal
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Discount
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Paid
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Balance
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {sales.map((sale) => (
            <tr
              key={sale.id}
              className="hover:bg-muted/30 transition-colors duration-150"
            >
              <td className="px-4 py-3 text-sm text-foreground">
                {new Date(sale.timestamp).toLocaleString()}
              </td>
              <td className="px-4 py-3 text-sm font-mono text-foreground">
                #{sale.id.slice(0, 8)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-foreground">
                {sale.totalItems}
              </td>
              <td className="px-4 py-3 text-sm text-right text-foreground">
                {formatKES(sale.subtotal)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-foreground">
                {formatKES(sale.discount)}
              </td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-foreground">
                {formatKES(sale.total)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-foreground">
                {formatKES(sale.amountPaid)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-foreground">
                {formatKES(sale.balance)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted/70 font-semibold">
            <td colSpan={2} className="px-4 py-3 text-right text-sm text-foreground">
              TOTALS:
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {totals.items}
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {formatKES(totals.subtotal)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {formatKES(totals.discount)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {formatKES(totals.total)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {formatKES(totals.amountPaid)}
            </td>
            <td className="px-4 py-3 text-sm text-right text-foreground">
              {formatKES(totals.balance)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
