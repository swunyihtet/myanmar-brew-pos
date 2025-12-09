import { Product, formatMMK } from '@/types/pos';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export function ProductGrid({ products, onSelectProduct }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <p>No products found</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.map((product, index) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            disabled={!product.isAvailable}
            className={cn(
              'product-card text-left animate-fade-in',
              !product.isAvailable && 'opacity-50 cursor-not-allowed'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {/* Product Image */}
            <div className="aspect-square bg-gradient-to-br from-secondary to-muted relative overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center text-4xl">
                {product.categoryId === 'coffee' && '☕'}
                {product.categoryId === 'tea' && '🍵'}
                {product.categoryId === 'frappe' && '🧋'}
                {product.categoryId === 'pastry' && '🥐'}
                {product.categoryId === 'addons' && '✨'}
                {product.categoryId === 'bottled' && '🧃'}
                {product.categoryId === 'merch' && '👕'}
              </div>
              {product.isPopular && (
                <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-bold px-2 py-1 rounded-full">
                  Popular
                </div>
              )}
              {!product.isAvailable && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                  <span className="text-muted-foreground font-medium">Sold Out</span>
                </div>
              )}
            </div>
            
            {/* Product Info */}
            <div className="p-3">
              <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
              <p className="text-primary font-bold mt-1">{formatMMK(product.basePrice)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
