import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface CreateCategoryData {
  name: string;
  icon?: string;
  sort_order?: number;
}

interface UpdateCategoryData {
  id: string;
  name?: string;
  icon?: string;
  sort_order?: number;
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async (data: CreateCategoryData) => {
      if (!activeShopId) throw new Error('No active shop ID');
      const { data: category, error } = await supabase
        .from('categories')
        .insert({
          shop_id: activeShopId,
          name: data.name,
          icon: data.icon || '☕',
          sort_order: data.sort_order || 0,
        })
        .select()
        .single();

      if (error) throw error;
      return category;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create category: ' + error.message);
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateCategoryData) => {
      if (!activeShopId) throw new Error('No active shop ID');
      const { error } = await supabase
        .from('categories')
        .update(data)
        .eq('id', id)
        .eq('shop_id', activeShopId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update category: ' + error.message);
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      if (!activeShopId) throw new Error('No active shop ID');
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
        .eq('shop_id', activeShopId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Category deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete category: ' + error.message);
    },
  });
}

