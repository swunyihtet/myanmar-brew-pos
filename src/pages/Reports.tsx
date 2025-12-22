import { useState } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { useDateRangeReport } from '@/hooks/useReports';
import { formatMMK } from '@/types/pos';
import { TrendingUp, ShoppingBag, DollarSign, Clock, Loader2, CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const Reports = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const [startDate, setStartDate] = useState<Date>(today);
  const [endDate, setEndDate] = useState<Date>(endOfToday);

  const { data: orders, isLoading, error } = useDateRangeReport(startDate, endDate);

  // Calculate report data from orders
  const report = (() => {
    if (!orders) return null;

    const completedOrders = orders.filter(
      (o) => !['voided', 'refunded'].includes(o.status || '')
    );

    const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_mmk || 0), 0);
    const totalOrders = completedOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const pendingOrders = orders.filter(
      (o) => !['completed', 'voided', 'refunded'].includes(o.status || '')
    ).length;

    // Payment breakdown
    const paymentBreakdown: Record<string, number> = {};
    completedOrders.forEach((o) => {
      const method = o.payment_method || 'unknown';
      paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.total_mmk || 0);
    });

    // Top items
    const itemCounts: Record<string, number> = {};
    completedOrders.forEach((order) => {
      (order.order_items || []).forEach((item: { product_name_snapshot: string; qty: number }) => {
        const name = item.product_name_snapshot;
        itemCounts[name] = (itemCounts[name] || 0) + item.qty;
      });
    });

    const topItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalSales,
      totalOrders,
      avgOrderValue,
      pendingOrders,
      paymentBreakdown,
      topItems,
    };
  })();

  if (isLoading) {
    return (
      <div className="pos-container items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="pos-container items-center justify-center">
        <p className="text-destructive">Failed to load reports.</p>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Sales',
      value: formatMMK(report.totalSales),
      icon: DollarSign,
      color: 'bg-success/10 text-success',
    },
    {
      label: 'Total Orders',
      value: report.totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Avg Order Value',
      value: formatMMK(Math.round(report.avgOrderValue)),
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: 'Pending Orders',
      value: report.pendingOrders.toString(),
      icon: Clock,
      color: 'bg-warning/10 text-warning',
    },
  ];

  const handleStartDateSelect = (date: Date | undefined) => {
    if (date) {
      date.setHours(0, 0, 0, 0);
      setStartDate(date);
      if (date > endDate) {
        const newEndDate = new Date(date);
        newEndDate.setHours(23, 59, 59, 999);
        setEndDate(newEndDate);
      }
    }
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    if (date) {
      date.setHours(23, 59, 59, 999);
      setEndDate(date);
      if (date < startDate) {
        const newStartDate = new Date(date);
        newStartDate.setHours(0, 0, 0, 0);
        setStartDate(newStartDate);
      }
    }
  };

  return (
    <div className="pos-container">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl font-display font-bold text-foreground">
            Reports & Analytics
          </h1>

          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal min-w-[140px]")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(startDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={handleStartDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <span className="text-muted-foreground">to</span>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("justify-start text-left font-normal min-w-[140px]")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(endDate, 'MMM dd, yyyy')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={handleEndDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Top Selling Items</h2>
            {report.topItems.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {report.topItems.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium">{item.name}</span>
                    <span className="text-muted-foreground">{item.count} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Payment Methods</h2>
            {Object.keys(report.paymentBreakdown).length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(report.paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{method}</span>
                    <span className="text-primary font-bold">{formatMMK(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
