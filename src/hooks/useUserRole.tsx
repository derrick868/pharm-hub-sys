import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'pharmacist' | 'staff';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      console.log('[useUserRole] 🕒 Waiting for auth to finish...');
      return;
    }

    if (!user) {
      console.log('[useUserRole] ❌ No user yet — skipping role fetch');
      setLoading(true);
      return;
    }

    console.log('[useUserRole] 🔍 Fetching roles for user:', user.id);

    const fetchRoles = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('[useUserRole] ⚠️ Error fetching roles:', error);
        setRoles([]);
      } else {
        console.log('[useUserRole] ✅ Roles fetched:', data);
        setRoles(data?.map((r: any) => r.role as UserRole) || []);
      }
      setLoading(false);
    };

    fetchRoles();
  }, [user, authLoading]);

  const hasRole = (role: UserRole) => roles.includes(role);
  const isAdmin = hasRole('admin');

  return { roles, hasRole, isAdmin, loading };
};
