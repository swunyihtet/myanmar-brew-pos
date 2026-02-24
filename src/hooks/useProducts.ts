import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface UpdateProductData {
  id: string;
  name?: string;
  price_mmk?: number;
  is_active?: boolean;
  is_popular?: boolean;
  category_id?: string;
}

interface CreateProductData {
  name: string;
  price_mmk: number;
  category_id?: string;
  is_active?: boolean;
  is_popular?: boolean;
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateProductData) => {
      const { data: product, error } = await supabase
        .from('products')
        .insert({
          shop_id: activeShopId,
          name: data.name,
          price_mmk: data.price_mmk,
          category_id: data.category_id || null,
          is_active: data.is_active ?? true,
          is_popular: data.is_popular ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return product;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create product: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateProductData) => {
      const { error } = await supabase
        .from('products')
        .update(data)
        .eq('id', id)
        .eq('shop_id', activeShopId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update product: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)
        .eq('shop_id', activeShopId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete product: ' + error.message);
    },
  });
}
