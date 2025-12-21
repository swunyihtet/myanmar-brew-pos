import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface DbOrder {
  id: string;
  order_no: string;
  order_type: 'dine_in' | 'takeaway';
  status: 'paid' | 'in_progress' | 'ready' | 'completed' | 'voided' | 'refunded';
  customer_name: string | null;
  customer_phone: string | null;
  subtotal_mmk: number;
  discount_mmk: number;
  tax_mmk: number;
  total_mmk: number;
  payment_method: 'cash' | 'card' | 'mobile' | null;
  paid_mmk: number;
  change_mmk: number;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  unit_price_mmk: number;
  qty: number;
  line_total_mmk: number;
  notes: string | null;
}

export interface DbOrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_name_snapshot: string;
  price_delta_mmk: number;
}

export interface OrderWithItems extends DbOrder {
  order_items: (DbOrderItem & {
    order_item_modifiers: DbOrderItemModifier[];
  })[];
}

export interface CreateOrderInput {
  order_type: 'dine_in' | 'takeaway';
  customer_name?: string;
  customer_phone?: string;
  subtotal_mmk: number;
  discount_mmk: number;
  tax_mmk: number;
  total_mmk: number;
  payment_method: 'cash' | 'card' | 'mobile';
  paid_mmk: number;
  change_mmk: number;
  items: {
    product_id: string;
    product_name_snapshot: string;
    unit_price_mmk: number;
    qty: number;
    line_total_mmk: number;
    notes?: string;
    modifiers: {
      modifier_name_snapshot: string;
      price_delta_mmk: number;
    }[];
  }[];
}

async function fetchOrders(): Promise<OrderWithItems[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        order_item_modifiers (*)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

async function fetchTodayOrders(): Promise<OrderWithItems[]> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        order_item_modifiers (*)
      )
    `)
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as OrderWithItems[];
}

async function createOrder(input: CreateOrderInput): Promise<DbOrder> {
  // Insert order
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_type: input.order_type,
      customer_name: input.customer_name || null,
      customer_phone: input.customer_phone || null,
      subtotal_mmk: input.subtotal_mmk,
      discount_mmk: input.discount_mmk,
      tax_mmk: input.tax_mmk,
      total_mmk: input.total_mmk,
      payment_method: input.payment_method,
      paid_mmk: input.paid_mmk,
      change_mmk: input.change_mmk,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // Insert order items
  for (const item of input.items) {
    const { data: orderItem, error: itemError } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        product_id: item.product_id,
        product_name_snapshot: item.product_name_snapshot,
        unit_price_mmk: item.unit_price_mmk,
        qty: item.qty,
        line_total_mmk: item.line_total_mmk,
        notes: item.notes || null,
      })
      .select()
      .single();

    if (itemError) throw itemError;

    // Insert modifiers for this item
    if (item.modifiers.length > 0) {
      const { error: modifiersError } = await supabase
        .from('order_item_modifiers')
        .insert(
          item.modifiers.map((mod) => ({
            order_item_id: orderItem.id,
            modifier_name_snapshot: mod.modifier_name_snapshot,
            price_delta_mmk: mod.price_delta_mmk,
          }))
        );

      if (modifiersError) throw modifiersError;
    }
  }

  return order as DbOrder;
}

async function updateOrderStatus(
  orderId: string, 
  status: DbOrder['status']
): Promise<void> {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
}

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: fetchOrders,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useTodayOrders() {
  return useQuery({
    queryKey: ['orders', 'today'],
    queryFn: fetchTodayOrders,
    staleTime: 30 * 1000,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createOrder,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Order ${order.order_no} created successfully!`);
    },
    onError: (error) => {
      console.error('Failed to create order:', error);
      toast.error('Failed to create order. Please try again.');
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, status }: { orderId: string; status: DbOrder['status'] }) =>
      updateOrderStatus(orderId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated!');
    },
    onError: (error) => {
      console.error('Failed to update order status:', error);
      toast.error('Failed to update order status.');
    },
  });
}

// Real-time subscription hook
export function useOrdersRealtime() {
  const queryClient = useQueryClient();

  const subscribe = () => {
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['orders'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return { subscribe };
}
