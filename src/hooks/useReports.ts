import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DailyReport {
  totalSales: number;
  totalOrders: number;
  avgOrderValue: number;
  pendingOrders: number;
  paymentBreakdown: Record<string, number>;
  topItems: { name: string; count: number }[];
}

async function fetchDailyReport(date: Date, shopId: string): Promise<DailyReport> {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  // Fetch orders for the day
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(`
      id,
      total_mmk,
      status,
      payment_method,
      order_items (
        product_name_snapshot,
        qty
      )
    `)
    .eq('shop_id', shopId)
    .gte('created_at', startOfDay.toISOString())
    .lte('created_at', endOfDay.toISOString());

  if (ordersError) throw ordersError;

  const validOrders = orders || [];
  const completedOrders = validOrders.filter(
    (o) => !['voided', 'refunded'].includes(o.status)
  );

  const totalSales = completedOrders.reduce((sum, o) => sum + (o.total_mmk || 0), 0);
  const totalOrders = completedOrders.length;
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
  const pendingOrders = validOrders.filter(
    (o) => !['completed', 'voided', 'refunded'].includes(o.status)
  ).length;

  // Payment breakdown
  const paymentBreakdown: Record<string, number> = {};
  completedOrders.forEach((o) => {
    const method = o.payment_method || 'unknown';
    paymentBreakdown[method] = (paymentBreakdown[method] || 0) + (o.total_mmk || 0);
  });

  // Top items
  const itemCounts: Record<string, number> = {};
  completedOrders.forEach((order) => {
    (order.order_items || []).forEach((item: { product_name_snapshot: string; qty: number }) => {
      const name = item.product_name_snapshot;
      itemCounts[name] = (itemCounts[name] || 0) + item.qty;
    });
  });

  const topItems = Object.entries(itemCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  return {
    totalSales,
    totalOrders,
    avgOrderValue,
    pendingOrders,
    paymentBreakdown,
    topItems,
  };
}

export function useDailyReport(date: Date = new Date()) {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['report', 'daily', date.toDateString(), activeShopId],
    queryFn: () => fetchDailyReport(date, activeShopId!),
    enabled: !!activeShopId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useDateRangeReport(startDate: Date, endDate: Date) {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['report', 'range', startDate.toDateString(), endDate.toDateString(), activeShopId],
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_no,
          order_type,
          status,
          total_mmk,
          payment_method,
          created_at,
          order_items (
            product_name_snapshot,
            qty,
            line_total_mmk
          )
        `)
        .eq('shop_id', activeShopId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      return orders || [];
    },
    enabled: !!activeShopId,
    staleTime: 60 * 1000,
  });
}
