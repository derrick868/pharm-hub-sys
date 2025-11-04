import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'pharmacist' | 'staff';

export const useUserRole = () => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🕒 Wait until auth is finished before checking roles
    if (authLoading) return;

    const fetchRoles = async () => {
      if (!user) {
        // Don’t set loading false yet; just wait for user to exist
        setRoles([]);
        return;
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching roles:', error);
        setRoles([]);
      } else {
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
