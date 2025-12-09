import { Minus, Plus, Trash2, ShoppingBag, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CartItem, OrderType, formatMMK } from '@/types/pos';
import { cn } from '@/lib/utils';

interface CartProps {
  items: CartItem[];
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  onUpdateQuantity: (id: string, qty: number) => void;
  onRemove: (id: string) => void;
  onOrderTypeChange: (type: OrderType) => void;
  onCustomerNameChange: (name: string) => void;
  onCustomerPhoneChange: (phone: string) => void;
  onCheckout: () => void;
}

export function Cart({
  items,
  orderType,
  customerName,
  customerPhone,
  subtotal,
  discountAmount,
  taxAmount,
  total,
  onUpdateQuantity,
  onRemove,
  onOrderTypeChange,
  onCustomerNameChange,
  onCustomerPhoneChange,
  onCheckout,
}: CartProps) {
  return (
    <div className="pos-cart">
      {/* Header */}
      <div className="p-4 border-b border-border bg-primary text-primary-foreground">
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6" />
          <h2 className="font-display text-xl font-bold">Current Order</h2>
          <span className="ml-auto bg-primary-foreground/20 px-3 py-1 rounded-full text-sm font-medium">
            {items.length} items
          </span>
        </div>
      </div>

      {/* Order Type Toggle */}
      <div className="p-3 border-b border-border">
        <div className="flex gap-2">
          <button
            onClick={() => onOrderTypeChange('dine-in')}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg font-semibold transition-all',
              orderType === 'dine-in'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            🍽️ Dine-in
          </button>
          <button
            onClick={() => onOrderTypeChange('takeaway')}
            className={cn(
              'flex-1 py-3 px-4 rounded-lg font-semibold transition-all',
              orderType === 'takeaway'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            )}
          >
            📦 Takeaway
          </button>
        </div>
      </div>

      {/* Customer Info (Optional) */}
      <div className="p-3 border-b border-border space-y-2">
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Customer name (optional)"
            value={customerName}
            onChange={(e) => onCustomerNameChange(e.target.value)}
            className="pl-9 h-10 bg-secondary border-0"
          />
        </div>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Phone (optional)"
            value={customerPhone}
            onChange={(e) => onCustomerPhoneChange(e.target.value)}
            className="pl-9 h-10 bg-secondary border-0"
          />
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingBag className="h-16 w-16 mb-4 opacity-30" />
            <p className="text-lg">Cart is empty</p>
            <p className="text-sm">Tap a product to add</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="cart-item animate-slide-up">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{item.product.name}</h4>
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
                <button
                  onClick={() => onRemove(item.id)}
                  className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="qty-btn"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-bold">{item.quantity}</span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="qty-btn"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="font-bold text-foreground">{formatMMK(item.totalPrice)}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="p-4 border-t border-border bg-card space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatMMK(subtotal)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-success">
            <span>Discount</span>
            <span>-{formatMMK(discountAmount)}</span>
          </div>
        )}
        {taxAmount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (5%)</span>
            <span className="font-medium">{formatMMK(taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between text-xl font-bold pt-2 border-t border-border">
          <span>Total</span>
          <span className="text-primary">{formatMMK(total)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <div className="p-4 border-t border-border">
        <Button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full h-14 text-lg font-bold btn-touch bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          Checkout {items.length > 0 && `• ${formatMMK(total)}`}
        </Button>
      </div>
    </div>
  );
}
