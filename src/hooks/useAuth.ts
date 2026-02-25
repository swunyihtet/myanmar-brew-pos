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
  isReady: boolean;
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
  const [activeShopId, setActiveShopIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_SHOP_ID_KEY);
    } catch (e) {
      console.error('Error reading from localStorage:', e);
      return null;
    }
  });

  // Sync activeShopId with localStorage if it changes elsewhere (e.g. login)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACTIVE_SHOP_ID_KEY) {
        setActiveShopIdState(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);
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

  const { data: roles = [], isLoading: isRolesLoading, refetch: refetchRoles } = useQuery({
    queryKey: ['user-roles', user?.id],
    queryFn: () => fetchUserRoles(user!.id),
    enabled: !!user?.id,
  });

  // Automatically create a shop if user has no roles and is logged in
  useEffect(() => {
    const ensureShopExists = async () => {
      if (user && !isRolesLoading && roles.length === 0) {
        console.log('No roles found for user, creating default shop...');
        const shopName = `${user.user_metadata?.full_name || 'My'}'s Shop`;
        const slug = `${user.id.slice(0, 8)}-shop`;

        try {
          // 1. Create the shop
          const { data: shop, error: shopError } = await supabase
            .from('shops')
            .insert({
              name: shopName,
              slug: slug,
              owner_id: user.id
            })
            .select()
            .single();

          if (shopError) throw shopError;

          // 2. Assign admin role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: user.id,
              shop_id: shop.id,
              role: 'admin'
            });

          if (roleError) throw roleError;

          // 3. Refresh roles
          refetchRoles();
        } catch (err) {
          console.error('Error creating default shop:', err);
        }
      }
    };

    ensureShopExists();
  }, [user, roles, isRolesLoading, refetchRoles]);

  // Automatically select first shop if none selected OR if current activeShopId is not in roles
  useEffect(() => {
    if (roles.length > 0) {
      const currentShopInRoles = roles.some(r => r.shop_id === activeShopId);
      if (!activeShopId || !currentShopInRoles) {
        const firstShopId = roles[0].shop_id;
        setActiveShopIdState(firstShopId);
        localStorage.setItem(ACTIVE_SHOP_ID_KEY, firstShopId);
      }
    } else if (!isRolesLoading && roles.length === 0 && activeShopId) {
      // If user has no roles but has an activeShopId (e.g. after a data wipe or role change)
      setActiveShopIdState(null);
      localStorage.removeItem(ACTIVE_SHOP_ID_KEY);
    }
  }, [roles, activeShopId, isRolesLoading]);

  const setActiveShopId = (shopId: string) => {
    setActiveShopIdState(shopId);
    localStorage.setItem(ACTIVE_SHOP_ID_KEY, shopId);
    // Invalidate queries to reload data for the new shop
    queryClient.invalidateQueries();
  };

  const currentRoleObj = roles.find(r => r.shop_id === activeShopId);
  const role = currentRoleObj?.role || null;

  const isReady = !!user && !!activeShopId;

  return {
    user,
    session,
    role,
    roles,
    activeShopId,
    isLoading: isLoading || isRolesLoading,
    isReady,
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
