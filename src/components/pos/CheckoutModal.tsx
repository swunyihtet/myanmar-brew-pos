import { useState } from 'react';
import { X, Banknote, CreditCard, Smartphone, Printer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PaymentMethod, Order, formatMMK } from '@/types/pos';
import { cn } from '@/lib/utils';

interface CheckoutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  total: number;
  onConfirmPayment: (method: PaymentMethod, paidAmount?: number) => Order;
}

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: 'cash', label: 'Cash', icon: <Banknote className="h-6 w-6" /> },
  { id: 'card', label: 'Card', icon: <CreditCard className="h-6 w-6" /> },
  { id: 'mobile', label: 'Mobile Pay', icon: <Smartphone className="h-6 w-6" /> },
];

const quickAmounts = [1000, 2000, 5000, 10000, 20000, 50000];

export function CheckoutModal({ open, onOpenChange, total, onConfirmPayment }: CheckoutModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('cash');
  const [paidAmount, setPaidAmount] = useState<string>(total.toString());
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const numericPaidAmount = parseInt(paidAmount) || 0;
  const changeAmount = Math.max(0, numericPaidAmount - total);
  const canComplete = numericPaidAmount >= total;

  const handleConfirm = () => {
    const order = onConfirmPayment(selectedMethod, numericPaidAmount);
    setCompletedOrder(order);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setCompletedOrder(null);
    setPaidAmount(total.toString());
    setSelectedMethod('cash');
    onOpenChange(false);
  };

  const handleNewOrder = () => {
    handleClose();
  };

  // Show success screen after payment
  if (completedOrder) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-md p-0">
          <div className="p-8 text-center">
            <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
              <Check className="h-10 w-10 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">
              Payment Complete!
            </h2>
            <p className="text-muted-foreground mb-6">
              Order #{completedOrder.orderNumber}
            </p>

            <div className="bg-secondary rounded-xl p-4 mb-6 text-left">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Total</span>
                <span className="font-bold">{formatMMK(completedOrder.total)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium">{formatMMK(completedOrder.paidAmount || 0)}</span>
              </div>
              {completedOrder.changeAmount && completedOrder.changeAmount > 0 && (
                <div className="flex justify-between text-success font-bold">
                  <span>Change</span>
                  <span>{formatMMK(completedOrder.changeAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handlePrint}
                variant="outline"
                className="flex-1 h-12 btn-touch-sm"
              >
                <Printer className="h-5 w-5 mr-2" />
                Print Receipt
              </Button>
              <Button
                onClick={handleNewOrder}
                className="flex-1 h-12 btn-touch-sm bg-primary hover:bg-primary/90"
              >
                New Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-display">Checkout</DialogTitle>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {/* Total */}
          <div className="text-center py-4 bg-primary/5 rounded-xl">
            <p className="text-muted-foreground text-sm mb-1">Total Due</p>
            <p className="text-4xl font-bold text-primary">{formatMMK(total)}</p>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Payment Method</h3>
            <div className="grid grid-cols-3 gap-3">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={cn(
                    'p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2',
                    selectedMethod === method.id
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  {method.icon}
                  <span className="font-medium text-sm">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cash Amount (only for cash) */}
          {selectedMethod === 'cash' && (
            <div>
              <h3 className="font-semibold text-foreground mb-3">Amount Received</h3>
              <Input
                type="number"
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
                className="h-14 text-2xl text-center font-bold bg-secondary border-0"
              />
              <div className="flex flex-wrap gap-2 mt-3">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setPaidAmount(amount.toString())}
                    className="px-4 py-2 rounded-lg bg-secondary hover:bg-secondary/80 font-medium text-sm transition-colors"
                  >
                    {formatMMK(amount)}
                  </button>
                ))}
                <button
                  onClick={() => setPaidAmount(total.toString())}
                  className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-sm transition-colors"
                >
                  Exact
                </button>
              </div>

              {/* Change */}
              {canComplete && changeAmount > 0 && (
                <div className="mt-4 p-4 bg-success/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">Change Due</p>
                  <p className="text-2xl font-bold text-success">{formatMMK(changeAmount)}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Confirm Button */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleConfirm}
            disabled={!canComplete}
            className="w-full h-14 text-lg font-bold btn-touch bg-success hover:bg-success/90 text-success-foreground"
          >
            Complete Payment
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
