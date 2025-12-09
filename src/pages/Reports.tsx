import { Sidebar } from '@/components/pos/Sidebar';
import { usePOSStore } from '@/store/posStore';
import { formatMMK } from '@/types/pos';
import { TrendingUp, ShoppingBag, DollarSign, Clock } from 'lucide-react';

const Reports = () => {
  const { orders } = usePOSStore();

  // Calculate stats
  const totalSales = orders.reduce((sum, o) => sum + o.total, 0);
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  
  // Payment method breakdown
  const paymentBreakdown = orders.reduce((acc, o) => {
    const method = o.paymentMethod || 'unknown';
    acc[method] = (acc[method] || 0) + o.total;
    return acc;
  }, {} as Record<string, number>);

  // Top items
  const itemCounts = orders.reduce((acc, order) => {
    order.items.forEach((item) => {
      const name = item.product.name;
      acc[name] = (acc[name] || 0) + item.quantity;
    });
    return acc;
  }, {} as Record<string, number>);

  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Sales',
      value: formatMMK(totalSales),
      icon: DollarSign,
      color: 'bg-success/10 text-success',
    },
    {
      label: 'Total Orders',
      value: totalOrders.toString(),
      icon: ShoppingBag,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Avg Order Value',
      value: formatMMK(Math.round(avgOrderValue)),
      icon: TrendingUp,
      color: 'bg-accent/10 text-accent',
    },
    {
      label: 'Pending Orders',
      value: orders.filter((o) => o.status !== 'completed' && o.status !== 'cancelled').length.toString(),
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

        {/* Stats Grid */}
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
          {/* Top Items */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Top Selling Items</h2>
            {topItems.length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {topItems.map(([name, count], index) => (
                  <div key={name} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </span>
                    <span className="flex-1 font-medium">{name}</span>
                    <span className="text-muted-foreground">{count} sold</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Payment Methods</h2>
            {Object.keys(paymentBreakdown).length === 0 ? (
              <p className="text-muted-foreground">No data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(paymentBreakdown).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="capitalize font-medium">{method}</span>
                    <span className="text-primary font-bold">{formatMMK(amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-card rounded-xl border border-border p-6 mt-6">
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Orders</h2>
          {orders.length === 0 ? (
            <p className="text-muted-foreground">No orders yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Order #</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Type</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Items</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Total</th>
                    <th className="text-left py-3 px-4 text-muted-foreground font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map((order) => (
                    <tr key={order.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-4 font-semibold">{order.orderNumber}</td>
                      <td className="py-3 px-4 capitalize">{order.orderType}</td>
                      <td className="py-3 px-4">{order.items.length} items</td>
                      <td className="py-3 px-4 font-semibold text-primary">{formatMMK(order.total)}</td>
                      <td className="py-3 px-4">
                        <span className={`status-badge status-${order.status === 'in-progress' ? 'progress' : order.status}`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Reports;
