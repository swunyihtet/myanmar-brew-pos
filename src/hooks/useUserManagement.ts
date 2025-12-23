import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserWithRole {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string | null;
  role: 'cashier' | 'supervisor' | 'admin';
}

async function fetchUsersWithRoles(): Promise<UserWithRole[]> {
  // Fetch profiles
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (profilesError) throw profilesError;

  // Fetch user roles
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*');

  if (rolesError) throw rolesError;

  // Combine profiles with roles
  return (profiles || []).map((profile) => {
    const userRole = roles?.find((r) => r.user_id === profile.id);
    return {
      id: profile.id,
      full_name: profile.full_name,
      avatar_url: profile.avatar_url,
      created_at: profile.created_at,
      role: (userRole?.role || 'cashier') as 'cashier' | 'supervisor' | 'admin',
    };
  });
}

export function useUsersWithRoles() {
  return useQuery({
    queryKey: ['users-with-roles'],
    queryFn: fetchUsersWithRoles,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: 'cashier' | 'supervisor' | 'admin' }) => {
      // First check if user has a role entry
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role })
          .eq('user_id', userId);

        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      toast.success('User role updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update user role: ' + error.message);
    },
  });
}
