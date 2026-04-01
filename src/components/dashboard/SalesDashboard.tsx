import { useState, useMemo, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  BarChart3, 
  Banknote, 
  ShoppingCart, 
  TrendingUp, 
  Package,
  RotateCcw,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StatCard } from './StatCard';
import { SalesTable } from './SalesTable';
import { SalesCharts } from './SalesCharts';
import { useStockStore } from '@/store/stockStore';
import { useToast } from '@/hooks/use-toast';
import { formatKES } from '@/lib/currency';

export function SalesDashboard() {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isFiltered, setIsFiltered] = useState(false);
  
  const { sales } = useStockStore();
  const { toast } = useToast();

  const filteredSales = useMemo(() => {
    if (!isFiltered || !fromDate || !toDate) return sales;
    
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);
    
    return sales.filter((sale) => {
      const saleDate = new Date(sale.timestamp);
      return saleDate >= from && saleDate <= to;
    });
  }, [sales, fromDate, toDate, isFiltered]);

  const stats = useMemo(() => {
    const totalSales = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalTransactions = filteredSales.length;
    const avgSale = totalTransactions > 0 ? totalSales / totalTransactions : 0;
    const totalItems = filteredSales.reduce((sum, sale) => sum + sale.totalItems, 0);
    
    return { totalSales, totalTransactions, avgSale, totalItems };
  }, [filteredSales]);

  const handleFilter = () => {
    if (!fromDate || !toDate) {
      toast({
        title: 'Missing Dates',
        description: 'Please select both from and to dates.',
        variant: 'destructive',
      });
      return;
    }
    setIsFiltered(true);
  };

  const handleReset = () => {
    setFromDate('');
    setToDate('');
    setIsFiltered(false);
  };

  const handleExportCSV = () => {
    if (filteredSales.length === 0) {
      toast({
        title: 'No Data',
        description: 'No sales data to export.',
        variant: 'destructive',
      });
      return;
    }

    let csv = 'Date & Time,Transaction ID,Items,Subtotal,Discount,Total,Amount Paid,Balance\n';
    
    filteredSales.forEach((sale) => {
      const date = new Date(sale.timestamp).toLocaleString();
      csv += `"${date}",${sale.id},${sale.totalItems},${sale.subtotal.toFixed(2)},${sale.discount.toFixed(2)},${sale.total.toFixed(2)},${sale.amountPaid.toFixed(2)},${sale.balance.toFixed(2)}\n`;
    });

    const totals = filteredSales.reduce(
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

    csv += `\nTOTALS,,${totals.items},${totals.subtotal.toFixed(2)},${totals.discount.toFixed(2)},${totals.total.toFixed(2)},${totals.amountPaid.toFixed(2)},${totals.balance.toFixed(2)}\n`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: 'Sales data has been exported to CSV.',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="animate-fade-in">
      <div className="bg-card rounded-2xl shadow-card p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 pb-6 border-b border-border no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">Sales Dashboard</h2>
          </div>
          
          <div className="flex gap-3">
            <Button variant="success" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button variant="info" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Day-End Report
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Sales"
            value={formatKES(stats.totalSales)}
            icon={Banknote}
          />
          <StatCard
            label="Total Transactions"
            value={stats.totalTransactions.toString()}
            icon={ShoppingCart}
          />
          <StatCard
            label="Average Sale"
            value={formatKES(stats.avgSale)}
            icon={TrendingUp}
          />
          <StatCard
            label="Items Sold"
            value={stats.totalItems.toString()}
            icon={Package}
          />
        </div>

        {/* Filter Section */}
        <div className="bg-muted/50 rounded-xl p-5 mb-6 no-print">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="fromDate" className="text-foreground mb-2 block">
                From Date
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="toDate" className="text-foreground mb-2 block">
                To Date
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="bg-background border-input"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filter
              </Button>
              <Button variant="secondary" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <SalesTable sales={filteredSales} />

        {/* Sales Charts - Performance Reports */}
        <SalesCharts sales={sales} />
      </div>
    </div>
  );
}
