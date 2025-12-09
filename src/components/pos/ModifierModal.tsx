import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Product, ModifierSet, SelectedModifier, formatMMK } from '@/types/pos';
import { cn } from '@/lib/utils';

interface ModifierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  modifierSets: ModifierSet[];
  onAddToCart: (modifiers: SelectedModifier[], specialInstructions?: string) => void;
}

export function ModifierModal({
  open,
  onOpenChange,
  product,
  modifierSets,
  onAddToCart,
}: ModifierModalProps) {
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, string[]>>({});
  const [specialInstructions, setSpecialInstructions] = useState('');

  if (!product) return null;

  const productModifierSets = modifierSets.filter((set) =>
    product.modifierSetIds.includes(set.id)
  );

  const handleSelectOption = (setId: string, optionId: string, isMultiple: boolean) => {
    setSelectedModifiers((prev) => {
      if (isMultiple) {
        const current = prev[setId] || [];
        const isSelected = current.includes(optionId);
        return {
          ...prev,
          [setId]: isSelected
            ? current.filter((id) => id !== optionId)
            : [...current, optionId],
        };
      } else {
        return {
          ...prev,
          [setId]: [optionId],
        };
      }
    });
  };

  const calculateTotal = () => {
    let total = product.basePrice;
    Object.entries(selectedModifiers).forEach(([setId, optionIds]) => {
      const set = modifierSets.find((s) => s.id === setId);
      if (set) {
        optionIds.forEach((optionId) => {
          const option = set.options.find((o) => o.id === optionId);
          if (option) {
            total += option.priceAdjustment;
          }
        });
      }
    });
    return total;
  };

  const handleAdd = () => {
    const modifiers: SelectedModifier[] = [];
    Object.entries(selectedModifiers).forEach(([setId, optionIds]) => {
      const set = modifierSets.find((s) => s.id === setId);
      if (set) {
        optionIds.forEach((optionId) => {
          const option = set.options.find((o) => o.id === optionId);
          if (option) {
            modifiers.push({
              setId,
              setName: set.name,
              optionId,
              optionName: option.name,
              priceAdjustment: option.priceAdjustment,
            });
          }
        });
      }
    });
    onAddToCart(modifiers, specialInstructions || undefined);
    setSelectedModifiers({});
    setSpecialInstructions('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setSelectedModifiers({});
    setSpecialInstructions('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-6 pb-4 sticky top-0 bg-card z-10 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl font-display">{product.name}</DialogTitle>
              <p className="text-primary font-bold text-lg mt-1">
                Base: {formatMMK(product.basePrice)}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </DialogHeader>

        <div className="p-6 space-y-6">
          {productModifierSets.map((set) => (
            <div key={set.id}>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                {set.name}
                {set.required && (
                  <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded">
                    Required
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap gap-2">
                {set.options.map((option) => {
                  const isSelected = (selectedModifiers[set.id] || []).includes(option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleSelectOption(set.id, option.id, set.type === 'multiple')}
                      className={cn(
                        'modifier-chip',
                        isSelected && 'modifier-chip-active'
                      )}
                    >
                      {option.name}
                      {option.priceAdjustment > 0 && (
                        <span className="ml-1 text-xs opacity-75">
                          +{formatMMK(option.priceAdjustment)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instructions */}
          <div>
            <h3 className="font-semibold text-foreground mb-3">Special Instructions</h3>
            <Textarea
              placeholder="Any special requests..."
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="bg-secondary border-0 resize-none"
              rows={2}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border sticky bottom-0 bg-card">
          <Button
            onClick={handleAdd}
            className="w-full h-14 text-lg font-bold btn-touch bg-primary hover:bg-primary/90"
          >
            Add to Cart • {formatMMK(calculateTotal())}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
