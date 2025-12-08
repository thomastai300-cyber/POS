import { useMemo, useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import type { Sale } from '@/types';
import { formatKES } from '@/lib/currency';

interface SalesChartsProps {
  sales: Sale[];
}

export function SalesCharts({ sales }: SalesChartsProps) {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const dailyData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      date.setHours(0, 0, 0, 0);
      return date;
    });

    return last7Days.map((date) => {
      const dayStart = date.getTime();
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const daySales = sales.filter(
        (sale) => sale.timestamp >= dayStart && sale.timestamp < dayEnd
      );
      
      const total = daySales.reduce((sum, sale) => sum + sale.total, 0);
      const transactions = daySales.length;
      
      return {
        name: date.toLocaleDateString('en-KE', { weekday: 'short' }),
        date: date.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }),
        sales: total,
        transactions,
      };
    });
  }, [sales]);

  const weeklyData = useMemo(() => {
    const last4Weeks = Array.from({ length: 4 }, (_, i) => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() - (i * 7));
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      return { startDate, endDate, weekNum: 4 - i };
    }).reverse();

    return last4Weeks.map(({ startDate, endDate, weekNum }) => {
      const weekSales = sales.filter(
        (sale) => sale.timestamp >= startDate.getTime() && sale.timestamp <= endDate.getTime()
      );
      
      const total = weekSales.reduce((sum, sale) => sum + sale.total, 0);
      const transactions = weekSales.length;
      
      return {
        name: `Week ${weekNum}`,
        date: `${startDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} - ${endDate.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}`,
        sales: total,
        transactions,
      };
    });
  }, [sales]);

  const monthlyData = useMemo(() => {
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - i));
      return date;
    });

    return last6Months.map((date) => {
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      
      const monthSales = sales.filter(
        (sale) => sale.timestamp >= monthStart && sale.timestamp <= monthEnd
      );
      
      const total = monthSales.reduce((sum, sale) => sum + sale.total, 0);
      const transactions = monthSales.length;
      
      return {
        name: date.toLocaleDateString('en-KE', { month: 'short' }),
        date: date.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' }),
        sales: total,
        transactions,
      };
    });
  }, [sales]);

  const chartData = period === 'daily' ? dailyData : period === 'weekly' ? weeklyData : monthlyData;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-1">{payload[0]?.payload?.date || label}</p>
          <p className="text-sm text-primary font-bold">{formatKES(payload[0]?.value || 0)}</p>
          <p className="text-xs text-muted-foreground">{payload[0]?.payload?.transactions || 0} transactions</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Sales Performance</CardTitle>
          </div>
          
          <Tabs value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <TabsList className="grid grid-cols-3 w-[240px]">
              <TabsTrigger value="daily" className="text-xs">
                <Calendar className="w-3 h-3 mr-1" />
                Daily
              </TabsTrigger>
              <TabsTrigger value="weekly" className="text-xs">
                <BarChart3 className="w-3 h-3 mr-1" />
                Weekly
              </TabsTrigger>
              <TabsTrigger value="monthly" className="text-xs">
                <TrendingUp className="w-3 h-3 mr-1" />
                Monthly
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {period === 'daily' ? (
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#salesGradient)" 
                />
              </AreaChart>
            ) : period === 'weekly' ? (
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="sales" 
                  fill="hsl(var(--primary))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'hsl(var(--primary))' }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Total Sales</p>
            <p className="text-sm font-bold text-foreground">
              {formatKES(chartData.reduce((sum, d) => sum + d.sales, 0))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Transactions</p>
            <p className="text-sm font-bold text-foreground">
              {chartData.reduce((sum, d) => sum + d.transactions, 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Avg per {period === 'daily' ? 'Day' : period === 'weekly' ? 'Week' : 'Month'}</p>
            <p className="text-sm font-bold text-foreground">
              {formatKES(chartData.reduce((sum, d) => sum + d.sales, 0) / chartData.length || 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
