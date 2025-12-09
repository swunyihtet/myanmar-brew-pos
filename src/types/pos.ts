// Core POS Types for Myanmar Coffee Shop

export interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export interface ModifierOption {
  id: string;
  name: string;
  priceAdjustment: number; // in MMK
}

export interface ModifierSet {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  required: boolean;
  options: ModifierOption[];
}

export interface Product {
  id: string;
  name: string;
  nameMM?: string; // Myanmar name
  categoryId: string;
  basePrice: number; // in MMK
  image?: string;
  modifierSetIds: string[];
  isPopular?: boolean;
  isAvailable: boolean;
}

export interface SelectedModifier {
  setId: string;
  setName: string;
  optionId: string;
  optionName: string;
  priceAdjustment: number;
}

export interface CartItem {
  id: string; // unique cart item id
  product: Product;
  quantity: number;
  modifiers: SelectedModifier[];
  specialInstructions?: string;
  unitPrice: number; // calculated price with modifiers
  totalPrice: number; // unitPrice * quantity
}

export type OrderType = 'dine-in' | 'takeaway';
export type PaymentMethod = 'cash' | 'card' | 'mobile';
export type OrderStatus = 'paid' | 'in-progress' | 'ready' | 'completed' | 'cancelled';

export interface Order {
  id: string;
  orderNumber: string; // e.g., A001
  items: CartItem[];
  orderType: OrderType;
  customerName?: string;
  customerPhone?: string;
  subtotal: number;
  discountAmount: number;
  discountType?: 'percent' | 'fixed';
  taxAmount: number;
  total: number;
  paymentMethod?: PaymentMethod;
  paidAmount?: number;
  changeAmount?: number;
  status: OrderStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  taxEnabled: boolean;
  taxRate: number; // percentage
  taxInclusive: boolean;
  receiptHeader?: string;
  receiptFooter?: string;
  currency: string;
  currencySymbol: string;
}

// Utility function to format MMK currency
export function formatMMK(amount: number): string {
  return `Ks ${amount.toLocaleString('en-US')}`;
}

// Generate order number for the day
export function generateOrderNumber(sequence: number): string {
  const prefix = String.fromCharCode(65 + Math.floor(sequence / 999)); // A, B, C...
  const num = (sequence % 999) + 1;
  return `${prefix}${num.toString().padStart(3, '0')}`;
}
