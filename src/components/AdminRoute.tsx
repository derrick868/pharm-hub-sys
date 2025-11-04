import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  console.log('[AdminRoute] 🔍 user:', user);
  console.log('[AdminRoute] 👑 isAdmin:', isAdmin);
  console.log('[AdminRoute] ⏳ authLoading:', authLoading, '| roleLoading:', roleLoading);

  // 🕒 Show a spinner while loading authentication or role
  if (authLoading || roleLoading) {
    console.log('[AdminRoute] ⏱ Still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 🚫 No user is logged in
  if (!user) {
    console.log('[AdminRoute] ❌ No user — redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // ⚠️ User logged in but not admin
  if (!isAdmin) {
    console.log('[AdminRoute] ⚠️ Not admin — redirecting to /home');
    return <Navigate to="/home" replace />;
  }

  // ✅ User is admin, show the protected content
  console.log('[AdminRoute] ✅ Access granted — rendering children');
  return <>{children}</>;
};
