import { Sidebar } from '@/components/pos/Sidebar';
import { useDailyReport } from '@/hooks/useReports';
import { formatMMK } from '@/types/pos';
import { TrendingUp, ShoppingBag, DollarSign, Clock, Loader2 } from 'lucide-react';

const Reports = () => {
  const { data: report, isLoading, error } = useDailyReport(new Date());

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

  return (
    <div className="pos-container">
      <Sidebar />

      <div className="flex-1 overflow-y-auto p-6">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">
          Reports & Analytics
        </h1>

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
