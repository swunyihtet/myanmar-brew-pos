import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { OrderCard } from '@/components/orders/OrderCard';
import { useTodayOrders, useUpdateOrderStatus, useOrdersRealtime, DbOrder } from '@/hooks/useOrders';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type StatusFilter = DbOrder['status'] | 'all';

const statusFilters: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All Orders' },
  { id: 'paid', label: 'Paid' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'ready', label: 'Ready' },
  { id: 'completed', label: 'Completed' },
];

const Orders = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const { data: orders = [], isLoading, error } = useTodayOrders();
  const updateStatus = useUpdateOrderStatus();
  const { subscribe } = useOrdersRealtime();

  useEffect(() => {
    const unsubscribe = subscribe();
    return unsubscribe;
  }, [subscribe]);

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter((order) => order.status === statusFilter);

  const orderCounts = {
    all: orders.length,
    paid: orders.filter((o) => o.status === 'paid').length,
    in_progress: orders.filter((o) => o.status === 'in_progress').length,
    ready: orders.filter((o) => o.status === 'ready').length,
    completed: orders.filter((o) => o.status === 'completed').length,
  };

  const handleUpdateStatus = (orderId: string, status: string) => {
    updateStatus.mutate({ orderId, status: status as DbOrder['status'] });
  };

  if (isLoading) {
    return (
      <div className="pos-container items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="pos-container items-center justify-center">
        <p className="text-destructive">Failed to load orders.</p>
      </div>
    );
  }

  return (
    <div className="pos-container">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="p-6 bg-card border-b border-border">
          <h1 className="text-3xl font-display font-bold text-foreground mb-4">
            Order Management
          </h1>

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
                  {orderCounts[filter.id as keyof typeof orderCounts] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>

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
                  order={{
                    id: order.id,
                    orderNumber: order.order_no,
                    items: order.order_items.map((item) => ({
                      id: item.id,
                      product: { id: item.product_id || '', name: item.product_name_snapshot, categoryId: '', basePrice: item.unit_price_mmk, modifierSetIds: [], isAvailable: true },
                      quantity: item.qty,
                      modifiers: item.order_item_modifiers.map((m) => ({ setId: '', setName: '', optionId: '', optionName: m.modifier_name_snapshot, priceAdjustment: m.price_delta_mmk })),
                      unitPrice: item.unit_price_mmk,
                      totalPrice: item.line_total_mmk,
                    })),
                    orderType: order.order_type === 'dine_in' ? 'dine-in' : 'takeaway',
                    customerName: order.customer_name || undefined,
                    subtotal: order.subtotal_mmk,
                    discountAmount: order.discount_mmk,
                    taxAmount: order.tax_mmk,
                    total: order.total_mmk,
                    status: order.status.replace('_', '-') as any,
                    createdAt: new Date(order.created_at),
                    updatedAt: new Date(order.updated_at),
                  }}
                  onUpdateStatus={(status) => handleUpdateStatus(order.id, status.replace('-', '_'))}
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
