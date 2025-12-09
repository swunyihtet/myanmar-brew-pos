import { create } from 'zustand';
import { CartItem, Order, OrderType, OrderStatus, PaymentMethod, SelectedModifier, Product, generateOrderNumber, ShopSettings } from '@/types/pos';
import { shopSettings as defaultShopSettings } from '@/data/seedData';

interface POSState {
  // Cart
  cart: CartItem[];
  orderType: OrderType;
  customerName: string;
  customerPhone: string;
  discountPercent: number;
  discountFixed: number;
  
  // Orders
  orders: Order[];
  orderSequence: number;
  
  // Settings
  shopSettings: ShopSettings;
  
  // Cart Actions
  addToCart: (product: Product, modifiers: SelectedModifier[], specialInstructions?: string) => void;
  updateCartItemQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  setOrderType: (type: OrderType) => void;
  setCustomerName: (name: string) => void;
  setCustomerPhone: (phone: string) => void;
  setDiscount: (percent: number, fixed: number) => void;
  
  // Order Actions
  createOrder: (paymentMethod: PaymentMethod, paidAmount?: number) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  
  // Calculated Values
  getSubtotal: () => number;
  getDiscountAmount: () => number;
  getTaxAmount: () => number;
  getTotal: () => number;
}

export const usePOSStore = create<POSState>((set, get) => ({
  // Initial State
  cart: [],
  orderType: 'dine-in',
  customerName: '',
  customerPhone: '',
  discountPercent: 0,
  discountFixed: 0,
  orders: [],
  orderSequence: 0,
  shopSettings: defaultShopSettings,
  
  // Cart Actions
  addToCart: (product, modifiers, specialInstructions) => {
    const modifierTotal = modifiers.reduce((sum, m) => sum + m.priceAdjustment, 0);
    const unitPrice = product.basePrice + modifierTotal;
    
    const newItem: CartItem = {
      id: `${product.id}-${Date.now()}`,
      product,
      quantity: 1,
      modifiers,
      specialInstructions,
      unitPrice,
      totalPrice: unitPrice,
    };
    
    set((state) => ({
      cart: [...state.cart, newItem],
    }));
  },
  
  updateCartItemQuantity: (cartItemId, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(cartItemId);
      return;
    }
    
    set((state) => ({
      cart: state.cart.map((item) =>
        item.id === cartItemId
          ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
          : item
      ),
    }));
  },
  
  removeFromCart: (cartItemId) => {
    set((state) => ({
      cart: state.cart.filter((item) => item.id !== cartItemId),
    }));
  },
  
  clearCart: () => {
    set({
      cart: [],
      customerName: '',
      customerPhone: '',
      discountPercent: 0,
      discountFixed: 0,
    });
  },
  
  setOrderType: (type) => set({ orderType: type }),
  setCustomerName: (name) => set({ customerName: name }),
  setCustomerPhone: (phone) => set({ customerPhone: phone }),
  setDiscount: (percent, fixed) => set({ discountPercent: percent, discountFixed: fixed }),
  
  // Order Actions
  createOrder: (paymentMethod, paidAmount) => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discountAmount = state.getDiscountAmount();
    const taxAmount = state.getTaxAmount();
    const total = state.getTotal();
    
    const newOrder: Order = {
      id: `order-${Date.now()}`,
      orderNumber: generateOrderNumber(state.orderSequence),
      items: [...state.cart],
      orderType: state.orderType,
      customerName: state.customerName || undefined,
      customerPhone: state.customerPhone || undefined,
      subtotal,
      discountAmount,
      discountType: state.discountPercent > 0 ? 'percent' : state.discountFixed > 0 ? 'fixed' : undefined,
      taxAmount,
      total,
      paymentMethod,
      paidAmount: paidAmount || total,
      changeAmount: paidAmount ? Math.max(0, paidAmount - total) : 0,
      status: 'paid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    set((state) => ({
      orders: [newOrder, ...state.orders],
      orderSequence: state.orderSequence + 1,
      cart: [],
      customerName: '',
      customerPhone: '',
      discountPercent: 0,
      discountFixed: 0,
    }));
    
    return newOrder;
  },
  
  updateOrderStatus: (orderId, status) => {
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date() }
          : order
      ),
    }));
  },
  
  // Calculated Values
  getSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.totalPrice, 0);
  },
  
  getDiscountAmount: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const percentDiscount = subtotal * (state.discountPercent / 100);
    return percentDiscount + state.discountFixed;
  },
  
  getTaxAmount: () => {
    const state = get();
    const { shopSettings } = state;
    if (!shopSettings.taxEnabled) return 0;
    
    const subtotal = state.getSubtotal();
    const discount = state.getDiscountAmount();
    const taxableAmount = subtotal - discount;
    
    return Math.round(taxableAmount * (shopSettings.taxRate / 100));
  },
  
  getTotal: () => {
    const state = get();
    const subtotal = state.getSubtotal();
    const discount = state.getDiscountAmount();
    const tax = state.getTaxAmount();
    
    return subtotal - discount + tax;
  },
}));
