import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface DbCategory {
  id: string;
  name: string;
  icon: string;
  sort_order: number;
}

export interface DbProduct {
  id: string;
  category_id: string | null;
  name: string;
  name_mm: string | null;
  price_mmk: number;
  image_url: string | null;
  is_active: boolean;
  is_popular: boolean;
}

export interface DbModifierSet {
  id: string;
  name: string;
  type: 'single' | 'multiple';
  is_required: boolean;
  modifiers: DbModifier[];
}

export interface DbModifier {
  id: string;
  name: string;
  price_delta_mmk: number;
  sort_order: number;
}

export interface DbShopSettings {
  id: string;
  name: string;
  address: string;
  phone: string;
  tax_enabled: boolean;
  tax_rate: number;
  tax_inclusive: boolean;
  receipt_header: string | null;
  receipt_footer: string | null;
  currency: string;
  currency_symbol: string;
}

async function fetchCategories(shopId: string): Promise<DbCategory[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('shop_id', shopId)
    .order('sort_order');
  
  if (error) throw error;
  return data || [];
}

async function fetchProducts(shopId: string): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('name');
  
  if (error) throw error;
  return data || [];
}

async function fetchModifierSets(shopId: string): Promise<DbModifierSet[]> {
  const { data: sets, error: setsError } = await supabase
    .from('modifier_sets')
    .select('*')
    .eq('shop_id', shopId);
  
  if (setsError) throw setsError;
  
  const { data: modifiers, error: modifiersError } = await supabase
    .from('modifiers')
    .select('*')
    .eq('shop_id', shopId)
    .eq('is_active', true)
    .order('sort_order');
  
  if (modifiersError) throw modifiersError;
  
  return (sets || []).map((set) => ({
    ...set,
    type: set.type as 'single' | 'multiple',
    modifiers: (modifiers || []).filter((m) => m.modifier_set_id === set.id),
  }));
}

async function fetchProductModifierSets(): Promise<Record<string, string[]>> {
  // Note: product_modifier_sets is a junction table, it doesn't have shop_id 
  // but it joins products and modifier_sets which are filtered by shop_id
  const { data, error } = await supabase
    .from('product_modifier_sets')
    .select('product_id, modifier_set_id');
  
  if (error) throw error;
  
  const mapping: Record<string, string[]> = {};
  (data || []).forEach((row) => {
    if (!mapping[row.product_id]) {
      mapping[row.product_id] = [];
    }
    mapping[row.product_id].push(row.modifier_set_id);
  });
  
  return mapping;
}

async function fetchShopSettings(shopId: string): Promise<DbShopSettings | null> {
  const { data, error } = await supabase
    .from('shop_settings')
    .select('*')
    .eq('shop_id', shopId)
    .maybeSingle();
  
  if (error) throw error;
  return data;
}

export function useCategories() {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['categories', activeShopId],
    queryFn: () => fetchCategories(activeShopId!),
    enabled: !!activeShopId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProducts() {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['products', activeShopId],
    queryFn: () => fetchProducts(activeShopId!),
    enabled: !!activeShopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useModifierSets() {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['modifierSets', activeShopId],
    queryFn: () => fetchModifierSets(activeShopId!),
    enabled: !!activeShopId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProductModifierSets() {
  return useQuery({
    queryKey: ['productModifierSets'],
    queryFn: fetchProductModifierSets,
    staleTime: 5 * 60 * 1000,
  });
}

export function useShopSettings() {
  const { activeShopId } = useAuth();
  return useQuery({
    queryKey: ['shopSettings', activeShopId],
    queryFn: () => fetchShopSettings(activeShopId!),
    enabled: !!activeShopId,
    staleTime: 5 * 60 * 1000,
  });
}

// Combined hook for menu data
export function useMenu() {
  const categories = useCategories();
  const products = useProducts();
  const modifierSets = useModifierSets();
  const productModifierSets = useProductModifierSets();
  const shopSettings = useShopSettings();

  const isLoading = 
    categories.isLoading || 
    products.isLoading || 
    modifierSets.isLoading || 
    productModifierSets.isLoading ||
    shopSettings.isLoading;

  const error = 
    categories.error || 
    products.error || 
    modifierSets.error || 
    productModifierSets.error ||
    shopSettings.error;

  return {
    categories: categories.data || [],
    products: products.data || [],
    modifierSets: modifierSets.data || [],
    productModifierSets: productModifierSets.data || {},
    shopSettings: shopSettings.data,
    isLoading,
    error,
    refetch: () => {
      categories.refetch();
      products.refetch();
      modifierSets.refetch();
      productModifierSets.refetch();
      shopSettings.refetch();
    },
  };
}
