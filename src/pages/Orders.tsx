import { useState } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { OrderCard } from '@/components/orders/OrderCard';
import { usePOSStore } from '@/store/posStore';
import { OrderStatus } from '@/types/pos';
import { cn } from '@/lib/utils';

const statusFilters: { id: OrderStatus | 'all'; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'paid', label: 'Paid' },
  { id: 'in-progress', label: 'In Progress' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
];

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const { orders, updateOrderStatus } = usePOSStore();

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === statusFilter);

  const orderCounts = {
    all: orders.length,
    paid: orders.filter((o) => o.status === 'paid').length,
    'in-progress': orders.filter((o) => o.status === 'in-progress').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  return (
    <div className="pos-container">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-card border-b border-border">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Order Management
          </h1>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  'px-4 py-2 rounded-lg font-medium transition-all',
                  statusFilter === filter.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {filter.label}
                <span className="ml-2 px-2 py-0.5 rounded-full bg-background/20 text-xs">
                  {orderCounts[filter.id]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Orders Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <p className="text-xl">No orders found</p>
              <p className="text-sm mt-2">Orders will appear here after checkout</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onUpdateStatus={(status) => updateOrderStatus(order.id, status)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
