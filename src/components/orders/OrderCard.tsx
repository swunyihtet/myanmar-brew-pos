import { Clock, ChefHat, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order, OrderStatus, formatMMK } from '@/types/pos';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onUpdateStatus: (status: OrderStatus) => void;
}

const statusConfig: Record<OrderStatus, { label: string; icon: React.ReactNode; className: string }> = {
  paid: { label: 'Paid', icon: <Clock className="h-4 w-4" />, className: 'status-paid' },
  'in-progress': { label: 'In Progress', icon: <ChefHat className="h-4 w-4" />, className: 'status-progress' },
  ready: { label: 'Ready', icon: <CheckCircle className="h-4 w-4" />, className: 'status-ready' },
  completed: { label: 'Completed', icon: <CheckCircle className="h-4 w-4" />, className: 'status-completed' },
  cancelled: { label: 'Cancelled', icon: <XCircle className="h-4 w-4" />, className: 'bg-destructive/20 text-destructive' },
};

const nextStatus: Record<OrderStatus, OrderStatus | null> = {
  paid: 'in-progress',
  'in-progress': 'ready',
  ready: 'completed',
  completed: null,
  cancelled: null,
};

export function OrderCard({ order, onUpdateStatus }: OrderCardProps) {
  const config = statusConfig[order.status];
  const next = nextStatus[order.status];

  return (
    <div className={cn(
      'bg-card rounded-xl border border-border p-4 transition-all hover:shadow-lg',
      order.status === 'ready' && 'border-success/50 animate-pulse-soft'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-2xl font-bold text-foreground">{order.orderNumber}</h3>
          <p className="text-xs text-muted-foreground">
            {formatDistanceToNow(order.createdAt, { addSuffix: true })}
          </p>
        </div>
        <div className={cn('status-badge flex items-center gap-1', config.className)}>
          {config.icon}
          {config.label}
        </div>
      </div>

      {/* Order Type */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">
          {order.orderType === 'dine-in' ? '🍽️' : '📦'}
        </span>
        <span className="text-sm font-medium text-muted-foreground capitalize">
          {order.orderType}
        </span>
        {order.customerName && (
          <span className="text-sm text-foreground ml-2">• {order.customerName}</span>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="bg-secondary/50 rounded-lg p-2">
            <div className="flex justify-between">
              <span className="font-medium">
                {item.quantity}× {item.product.name}
              </span>
            </div>
            {item.modifiers.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.modifiers.map((m) => m.optionName).join(', ')}
              </p>
            )}
            {item.specialInstructions && (
              <p className="text-xs text-accent mt-1 italic">
                "{item.specialInstructions}"
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center pt-3 border-t border-border">
        <span className="font-bold text-lg">{formatMMK(order.total)}</span>
        {next && (
          <Button
            onClick={() => onUpdateStatus(next)}
            className={cn(
              'btn-touch-sm',
              next === 'in-progress' && 'bg-primary hover:bg-primary/90',
              next === 'ready' && 'bg-success hover:bg-success/90 text-success-foreground',
              next === 'completed' && 'bg-muted hover:bg-muted/90 text-muted-foreground'
            )}
          >
            {next === 'in-progress' && 'Start Preparing'}
            {next === 'ready' && 'Mark Ready'}
            {next === 'completed' && 'Complete'}
          </Button>
        )}
      </div>
    </div>
  );
}
