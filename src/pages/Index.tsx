import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/pos/Sidebar';
import { CategoryList } from '@/components/pos/CategoryList';
import { ProductGrid } from '@/components/pos/ProductGrid';
import { SearchBar } from '@/components/pos/SearchBar';
import { Cart } from '@/components/pos/Cart';
import { ModifierModal } from '@/components/pos/ModifierModal';
import { CheckoutModal } from '@/components/pos/CheckoutModal';
import { Receipt } from '@/components/pos/Receipt';
import { categories, products, modifierSets, shopSettings } from '@/data/seedData';
import { usePOSStore } from '@/store/posStore';
import { Product, SelectedModifier, PaymentMethod } from '@/types/pos';

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modifierModalOpen, setModifierModalOpen] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);

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
    createOrder,
    getSubtotal,
    getDiscountAmount,
    getTaxAmount,
    getTotal,
  } = usePOSStore();

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
  }, [selectedCategory, searchQuery]);

  const handleSelectProduct = (product: Product) => {
    // If product has modifiers, show modal
    if (product.modifierSetIds.length > 0) {
      setSelectedProduct(product);
      setModifierModalOpen(true);
    } else {
      // Add directly to cart
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

  const handleConfirmPayment = (method: PaymentMethod, paidAmount?: number) => {
    return createOrder(method, paidAmount);
  };

  // Get the most recent order for receipt printing
  const lastOrder = orders[0];

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
