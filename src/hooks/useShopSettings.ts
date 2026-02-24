import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

export interface UpdateShopSettingsInput {
  name?: string;
  address?: string;
  phone?: string;
  tax_enabled?: boolean;
  tax_rate?: number;
  tax_inclusive?: boolean;
  receipt_header?: string;
  receipt_footer?: string;
}

async function updateShopSettings(input: UpdateShopSettingsInput, shopId: string): Promise<void> {
  const { data: existing, error: fetchError } = await supabase
    .from('shop_settings')
    .select('id')
    .eq('shop_id', shopId)
    .maybeSingle();

  if (fetchError) {
    throw fetchError;
  }

  if (existing) {
    const { error } = await supabase
      .from('shop_settings')
      .update(input)
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Create new settings if they don't exist for this shop
    const { error } = await supabase
      .from('shop_settings')
      .insert({ ...input, shop_id: shopId });

    if (error) throw error;
  }
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();
  const { activeShopId } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateShopSettingsInput) => updateShopSettings(input, activeShopId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopSettings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to update shop settings:', error);
      toast.error('Failed to save settings. Please try again.');
    },
  });
}
