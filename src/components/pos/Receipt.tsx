import { Order, formatMMK, ShopSettings } from '@/types/pos';
import { format } from 'date-fns';

interface ReceiptProps {
  order: Order;
  shopSettings: ShopSettings;
}

export function Receipt({ order, shopSettings }: ReceiptProps) {
  return (
    <div className="receipt-print font-mono text-sm">
      {/* Header */}
      <div className="receipt-header">
        <h1 className="text-lg font-bold">{shopSettings.name}</h1>
        <p className="text-xs">{shopSettings.address}</p>
        <p className="text-xs">{shopSettings.phone}</p>
        {shopSettings.receiptHeader && (
          <p className="text-xs mt-2">{shopSettings.receiptHeader}</p>
        )}
      </div>

      {/* Order Info */}
      <div className="my-3">
        <div className="flex justify-between text-xs">
          <span>Order #:</span>
          <span className="font-bold">{order.orderNumber}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Date:</span>
          <span>{format(order.createdAt, 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span>Type:</span>
          <span>{order.orderType === 'dine-in' ? 'Dine-in' : 'Takeaway'}</span>
        </div>
        {order.customerName && (
          <div className="flex justify-between text-xs">
            <span>Customer:</span>
            <span>{order.customerName}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="receipt-items">
        <div className="border-b border-dashed pb-1 mb-2 text-xs font-bold">
          <div className="flex justify-between">
            <span>Item</span>
            <span>Amount</span>
          </div>
        </div>
        {order.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span>
                {item.quantity}x {item.product.name}
              </span>
              <span>{formatMMK(item.totalPrice)}</span>
            </div>
            {item.modifiers.map((mod, modIndex) => (
              <div key={modIndex} className="receipt-modifier text-xs text-gray-600">
                + {mod.optionName}
                {mod.priceAdjustment > 0 && ` (+${formatMMK(mod.priceAdjustment)})`}
              </div>
            ))}
            {item.specialInstructions && (
              <div className="receipt-modifier text-xs italic">
                Note: {item.specialInstructions}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="receipt-totals text-xs">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatMMK(order.subtotal)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatMMK(order.discountAmount)}</span>
          </div>
        )}
        {order.taxAmount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({shopSettings.taxRate}%):</span>
            <span>{formatMMK(order.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed">
          <span>TOTAL:</span>
          <span>{formatMMK(order.total)}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Payment:</span>
          <span className="capitalize">{order.paymentMethod}</span>
        </div>
        {order.paymentMethod === 'cash' && (
          <>
            <div className="flex justify-between">
              <span>Paid:</span>
              <span>{formatMMK(order.paidAmount || 0)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change:</span>
              <span>{formatMMK(order.changeAmount || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="receipt-footer mt-4 pt-2 border-t border-dashed">
        {shopSettings.receiptFooter && (
          <p className="text-xs">{shopSettings.receiptFooter}</p>
        )}
        <p className="text-xs mt-1">*** Thank You! ***</p>
      </div>
    </div>
  );
}
