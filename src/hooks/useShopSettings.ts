import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

async function updateShopSettings(input: UpdateShopSettingsInput): Promise<void> {
  // Get the first (and only) shop settings row
  const { data: existing, error: fetchError } = await supabase
    .from('shop_settings')
    .select('id')
    .limit(1)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }

  if (existing) {
    const { error } = await supabase
      .from('shop_settings')
      .update(input)
      .eq('id', existing.id);

    if (error) throw error;
  }
}

export function useUpdateShopSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShopSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shop-settings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error) => {
      console.error('Failed to update shop settings:', error);
      toast.error('Failed to save settings. Please try again.');
    },
  });
}
