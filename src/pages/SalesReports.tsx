import { useState, useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { useStockStore } from '@/store/stockStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from 'date-fns';
import { useEffect } from 'react';

type Period = 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'last_7' | 'last_30';

const periodLabels: Record<Period, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  this_week: 'This Week',
  last_week: 'Last Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  last_7: 'Last 7 Days',
  last_30: 'Last 30 Days',
};

function getDateRange(period: Period): { from: Date; to: Date } {
  const now = new Date();
  switch (period) {
    case 'today':
      return { from: new Date(now.setHours(0, 0, 0, 0)), to: new Date() };
    case 'yesterday': {
      const d = subDays(new Date(), 1);
      return { from: new Date(d.setHours(0, 0, 0, 0)), to: new Date(new Date(d).setHours(23, 59, 59, 999)) };
    }
    case 'this_week':
      return { from: startOfWeek(new Date(), { weekStartsOn: 1 }), to: new Date() };
    case 'last_week': {
      const lw = subWeeks(new Date(), 1);
      return { from: startOfWeek(lw, { weekStartsOn: 1 }), to: endOfWeek(lw, { weekStartsOn: 1 }) };
    }
    case 'this_month':
      return { from: startOfMonth(new Date()), to: new Date() };
    case 'last_month': {
      const lm = subMonths(new Date(), 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case 'last_7':
      return { from: subDays(new Date(), 7), to: new Date() };
    case 'last_30':
      return { from: subDays(new Date(), 30), to: new Date() };
  }
}

export default function SalesReports() {
  const [period, setPeriod] = useState<Period>('today');
  const { sales, fetchSales } = useStockStore();
  const { toast } = useToast();

  useEffect(() => { fetchSales(); }, [fetchSales]);

  const { from, to } = useMemo(() => getDateRange(period), [period]);

  const filtered = useMemo(() => {
    const fromTs = from.getTime();
    const toTs = to.getTime();
    return sales.filter(s => s.timestamp >= fromTs && s.timestamp <= toTs);
  }, [sales, from, to]);

  const totals = useMemo(() => filtered.reduce(
    (acc, s) => ({
      items: acc.items + s.totalItems,
      subtotal: acc.subtotal + s.subtotal,
      discount: acc.discount + s.discount,
      total: acc.total + s.total,
      paid: acc.paid + s.amountPaid,
      balance: acc.balance + s.balance,
    }),
    { items: 0, subtotal: 0, discount: 0, total: 0, paid: 0, balance: 0 }
  ), [filtered]);

  const handleExport = () => {
    if (filtered.length === 0) {
      toast({ title: 'No Data', description: 'No sales in the selected period.', variant: 'destructive' });
      return;
    }

    let csv = 'Date & Time,Transaction ID,Customer,Payment Method,Items,Subtotal,Discount,Total,Amount Paid,Balance,Status\n';
    filtered.forEach(s => {
      const date = format(new Date(s.timestamp), 'yyyy-MM-dd HH:mm:ss');
      csv += `"${date}",${s.id},"${s.customerName || 'Walk-in'}",${s.paymentMethod},${s.totalItems},${s.subtotal.toFixed(2)},${s.discount.toFixed(2)},${s.total.toFixed(2)},${s.amountPaid.toFixed(2)},${s.balance.toFixed(2)},${s.status}\n`;
    });
    csv += `\nTOTALS,,,,${totals.items},${totals.subtotal.toFixed(2)},${totals.discount.toFixed(2)},${totals.total.toFixed(2)},${totals.paid.toFixed(2)},${totals.balance.toFixed(2)},\n`;
    csv += `\nReport Period:,${periodLabels[period]}\n`;
    csv += `From:,${format(from, 'yyyy-MM-dd')}\nTo:,${format(to, 'yyyy-MM-dd')}\n`;
    csv += `Total Transactions:,${filtered.length}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${period}-${format(new Date(), 'yyyyMMdd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exported', description: `${filtered.length} transactions exported to CSV.` });
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Sales Reports</h1>
              <p className="text-sm text-muted-foreground">Export sales data by period</p>
            </div>
          </div>
          <Button variant="success" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>

        {/* Period selector */}
        <Card className="p-5 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 max-w-xs">
              <Label className="mb-2 block text-sm font-medium">Report Period</Label>
              <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(periodLabels).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {format(from, 'MMM d, yyyy')} — {format(to, 'MMM d, yyyy')}
            </div>
          </div>
        </Card>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Sales', value: formatKES(totals.total) },
            { label: 'Transactions', value: filtered.length.toString() },
            { label: 'Items Sold', value: totals.items.toString() },
            { label: 'Avg Sale', value: formatKES(filtered.length > 0 ? totals.total / filtered.length : 0) },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-bold text-foreground mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Table */}
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Items</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No sales found for this period.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(s => (
                    <TableRow key={s.id}>
                      <TableCell className="text-sm">{format(new Date(s.timestamp), 'MMM d, HH:mm')}</TableCell>
                      <TableCell className="text-sm">{s.customerName || 'Walk-in'}</TableCell>
                      <TableCell className="text-sm capitalize">{s.paymentMethod}</TableCell>
                      <TableCell className="text-right text-sm">{s.totalItems}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatKES(s.total)}</TableCell>
                      <TableCell className="text-right text-sm">{formatKES(s.amountPaid)}</TableCell>
                      <TableCell className="text-sm capitalize">{s.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
              {filtered.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={3} className="font-bold">Totals</TableCell>
                    <TableCell className="text-right font-bold">{totals.items}</TableCell>
                    <TableCell className="text-right font-bold">{formatKES(totals.total)}</TableCell>
                    <TableCell className="text-right font-bold">{formatKES(totals.paid)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableFooter>
              )}
            </Table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
}
