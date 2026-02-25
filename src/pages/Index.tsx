import { useState, useMemo, useEffect } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { CategoryList } from '@/components/pos/CategoryList';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { SearchBar } from '@/components/pos/SearchBar';
import { Cart } from '@/components/pos/Cart';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { Receipt } from '@/components/pos/Receipt';
import { useMenu, DbProduct, DbModifierSet } from '@/hooks/useMenu';
import { useCreateOrder, useOrdersRealtime } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import { usePOSStore } from '@/store/posStore';
import { Product, SelectedModifier, PaymentMethod, Category, ModifierSet, ShopSettings } from '@/types/pos';
import { Loader2 } from 'lucide-react';

// Transform DB types to frontend types
function transformProduct(
  dbProduct: DbProduct,
  productModifierSets: Record<string, string[]>
): Product {
  return {
    id: dbProduct.id,
    name: dbProduct.name,
    nameMM: dbProduct.name_mm || undefined,
    categoryId: dbProduct.category_id || '',
    basePrice: dbProduct.price_mmk,
    image: dbProduct.image_url || undefined,
    modifierSetIds: productModifierSets[dbProduct.id] || [],
    isPopular: dbProduct.is_popular,
    isAvailable: dbProduct.is_active,
  };
}

function transformModifierSet(dbSet: DbModifierSet): ModifierSet {
  return {
    id: dbSet.id,
    name: dbSet.name,
    type: dbSet.type,
    required: dbSet.is_required,
    options: dbSet.modifiers.map((m) => ({
      id: m.id,
      name: m.name,
      priceAdjustment: m.price_delta_mmk,
    })),
  };
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

  const { isReady, isLoading: isAuthLoading } = useAuth();
  const { categories: dbCategories, products: dbProducts, modifierSets: dbModifierSets, productModifierSets, shopSettings: dbShopSettings, isLoading: isMenuLoading, error } = useMenu();
  const createOrderMutation = useCreateOrder();
  const { subscribe } = useOrdersRealtime();

  // Subscribe to real-time updates
  useEffect(() => {
    if (isReady) {
      const unsubscribe = subscribe();
      return unsubscribe;
    }
  }, [subscribe, isReady]);

  const {
    cart,
    orderType,
    customerName,
    customerPhone,
    orders,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    setOrderType,
    setCustomerName,
    setCustomerPhone,
    clearCart,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
    setShopSettings,
  } = usePOSStore();

  // Update shop settings in store when loaded from DB
  useEffect(() => {
    if (dbShopSettings) {
      setShopSettings({
        name: dbShopSettings.name,
        address: dbShopSettings.address,
        phone: dbShopSettings.phone,
        taxEnabled: dbShopSettings.tax_enabled,
        taxRate: Number(dbShopSettings.tax_rate),
        taxInclusive: dbShopSettings.tax_inclusive,
        receiptHeader: dbShopSettings.receipt_header || '',
        receiptFooter: dbShopSettings.receipt_footer || '',
        currency: dbShopSettings.currency,
        currencySymbol: dbShopSettings.currency_symbol,
      });
    }
  }, [dbShopSettings, setShopSettings]);

  // Transform data for UI
  const categories: Category[] = useMemo(() => {
    return dbCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      order: c.sort_order,
    }));
  }, [dbCategories]);

  const products: Product[] = useMemo(() => {
    return dbProducts.map((p) => transformProduct(p, productModifierSets));
  }, [dbProducts, productModifierSets]);

  const modifierSets: ModifierSet[] = useMemo(() => {
    return dbModifierSets.map(transformModifierSet);
  }, [dbModifierSets]);

  const shopSettings: ShopSettings = useMemo(() => {
    if (!dbShopSettings) {
      return {
        name: 'Golden Bean Coffee',
        address: 'No. 42, Shwedagon Pagoda Road, Yangon',
        phone: '+95 9 123 456 789',
        taxEnabled: true,
        taxRate: 5,
        taxInclusive: false,
        receiptHeader: 'Welcome to Golden Bean!',
        receiptFooter: 'Thank you for visiting!',
        currency: 'MMK',
        currencySymbol: 'Ks',
      };
    }
    return {
      name: dbShopSettings.name,
      address: dbShopSettings.address,
      phone: dbShopSettings.phone,
      taxEnabled: dbShopSettings.tax_enabled,
      taxRate: Number(dbShopSettings.tax_rate),
      taxInclusive: dbShopSettings.tax_inclusive,
      receiptHeader: dbShopSettings.receipt_header || '',
      receiptFooter: dbShopSettings.receipt_footer || '',
      currency: dbShopSettings.currency,
      currencySymbol: dbShopSettings.currency_symbol,
    };
  }, [dbShopSettings]);

  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by category
    if (selectedCategory === 'popular') {
      filtered = filtered.filter((p) => p.isPopular);
    } else if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.categoryId === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((p) =>
        p.name.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  const handleSelectProduct = (product: Product) => {
    if (product.modifierSetIds.length > 0) {
      setSelectedProduct(product);
      setModifierModalOpen(true);
    } else {
      addToCart(product, []);
    }
  };

  const handleAddToCart = (modifiers: SelectedModifier[], specialInstructions?: string) => {
    if (selectedProduct) {
      addToCart(selectedProduct, modifiers, specialInstructions);
    }
  };

  const handleCheckout = () => {
    if (cart.length > 0) {
      setCheckoutModalOpen(true);
    }
  };

  const handleConfirmPayment = async (method: PaymentMethod, paidAmount?: number) => {
    const subtotal = getSubtotal();
    const discountAmount = getDiscountAmount();
    const taxAmount = getTaxAmount();
    const total = getTotal();
    const paid = paidAmount || total;
    const change = Math.max(0, paid - total);

    const orderInput = {
      order_type: orderType === 'dine-in' ? 'dine_in' as const : 'takeaway' as const,
      customer_name: customerName || undefined,
      customer_phone: customerPhone || undefined,
      subtotal_mmk: subtotal,
      discount_mmk: discountAmount,
      tax_mmk: taxAmount,
      total_mmk: total,
      payment_method: method as 'cash' | 'card' | 'mobile',
      paid_mmk: paid,
      change_mmk: change,
      items: cart.map((item) => ({
        product_id: item.product.id,
        product_name_snapshot: item.product.name,
        unit_price_mmk: item.unitPrice,
        qty: item.quantity,
        line_total_mmk: item.totalPrice,
        notes: item.specialInstructions,
        modifiers: item.modifiers.map((mod) => ({
          modifier_name_snapshot: `${mod.setName}: ${mod.optionName}`,
          price_delta_mmk: mod.priceAdjustment,
        })),
      })),
    };

    const result = await createOrderMutation.mutateAsync(orderInput);
    
    // Clear cart after successful order (don't close modal - let CheckoutModal show success)
    clearCart();

    // Return a compatible order object for the receipt
    return {
      id: result.id,
      orderNumber: result.order_no,
      items: cart,
      orderType,
      customerName: customerName || undefined,
      customerPhone: customerPhone || undefined,
      subtotal,
      discountAmount,
      discountType: undefined,
      taxAmount,
      total,
      paymentMethod: method,
      paidAmount: paid,
      changeAmount: change,
      status: 'paid' as const,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    };
  };

  // Get the most recent order for receipt printing
  const lastOrder = orders[0];

  if (isAuthLoading || !isReady) {
    return (
      <div className="pos-container items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading session...</p>
      </div>
    );
  }

  if (isMenuLoading) {
    return (
      <div className="pos-container items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pos-container items-center justify-center">
        <p className="text-destructive">Failed to load menu. Please refresh.</p>
      </div>
    );
  }

  return (
    <div className="pos-container">
      {/* Navigation Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="pos-main">
        {/* Search Bar */}
        <div className="p-4 bg-card border-b border-border">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Categories */}
        <CategoryList
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        {/* Products */}
        <ProductGrid
          products={filteredProducts}
          onSelectProduct={handleSelectProduct}
        />
      </div>

      {/* Cart */}
      <Cart
        items={cart}
        orderType={orderType}
        customerName={customerName}
        customerPhone={customerPhone}
        subtotal={getSubtotal()}
        discountAmount={getDiscountAmount()}
        taxAmount={getTaxAmount()}
        total={getTotal()}
        onUpdateQuantity={updateCartItemQuantity}
        onRemove={removeFromCart}
        onOrderTypeChange={setOrderType}
        onCustomerNameChange={setCustomerName}
        onCustomerPhoneChange={setCustomerPhone}
        onCheckout={handleCheckout}
      />

      {/* Modifier Modal */}
      <ModifierModal
        open={modifierModalOpen}
        onOpenChange={setModifierModalOpen}
        product={selectedProduct}
        modifierSets={modifierSets}
        onAddToCart={handleAddToCart}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        open={checkoutModalOpen}
        onOpenChange={setCheckoutModalOpen}
        total={getTotal()}
        onConfirmPayment={handleConfirmPayment}
      />

      {/* Hidden Receipt for Printing */}
      {lastOrder && (
        <div className="hidden">
          <Receipt order={lastOrder} shopSettings={shopSettings} />
        </div>
      )}
    </div>
  );
};

export default Index;
