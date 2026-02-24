import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export type AppRole = 'cashier' | 'supervisor' | 'admin';

export interface UserRole {
  shop_id: string;
  role: AppRole;
  shop: {
    name: string;
    slug: string;
  };
}

export interface UserWithRole {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  roles: UserRole[];
  activeShopId: string | null;
  isLoading: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  setActiveShopId: (shopId: string) => void;
}

async function fetchUserRoles(userId: string): Promise<UserRole[]> {
  const { data, error } = await supabase
    .from('user_roles')
    .select(`
      shop_id,
      role,
      shop:shops (
        name,
        slug
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user roles:', error);
    return [];
  }

  return (data || []) as unknown as UserRole[];
}

const ACTIVE_SHOP_ID_KEY = 'pos_active_shop_id';

export function useAuth(): UserWithRole {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeShopId, setActiveShopIdState] = useState<string | null>(
    localStorage.getItem(ACTIVE_SHOP_ID_KEY)
  );

  // Sync activeShopId with localStorage if it changes elsewhere (e.g. login)
  useEffect(() => {
    const handleStorageChange = () => {
      const storedId = localStorage.getItem(ACTIVE_SHOP_ID_KEY);
      if (storedId !== activeShopId) {
        setActiveShopIdState(storedId);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [activeShopId]);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem(ACTIVE_SHOP_ID_KEY);
        setActiveShopIdState(null);
        queryClient.clear();
      }
    });

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: roles = [] } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: () => fetchUserRoles(user!.id),
    enabled: !!user?.id,
  });

  // Automatically select first shop if none selected
  useEffect(() => {
    if (roles.length > 0 && !activeShopId) {
      const firstShopId = roles[0].shop_id;
      setActiveShopIdState(firstShopId);
      localStorage.setItem(ACTIVE_SHOP_ID_KEY, firstShopId);
    }
  }, [roles, activeShopId]);

  const setActiveShopId = (shopId: string) => {
    setActiveShopIdState(shopId);
    localStorage.setItem(ACTIVE_SHOP_ID_KEY, shopId);
    // Invalidate queries to reload data for the new shop
    queryClient.invalidateQueries();
  };

  const currentRoleObj = roles.find(r => r.shop_id === activeShopId);
  const role = currentRoleObj?.role || null;

  return {
    user,
    session,
    role,
    roles,
    activeShopId,
    isLoading,
    isAdmin: role === 'admin',
    isSupervisor: role === 'supervisor' || role === 'admin',
    setActiveShopId,
  };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
