import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';

export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();

  // 🕒 Show a spinner while loading authentication or role
  if (authLoading || roleLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 🚫 No user is logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // ⚠️ User logged in but not admin
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // ✅ User is admin, show the protected content
  return <>{children}</>;
};
