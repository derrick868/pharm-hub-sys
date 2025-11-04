import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { signOut } = useAuth();

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col">
            <header className="h-14 border-b flex items-center justify-between px-3 sm:px-4 lg:px-6 bg-card">
              <div className="flex items-center min-w-0">
                <SidebarTrigger />
                <h1 className="ml-2 sm:ml-4 font-semibold text-sm sm:text-base lg:text-lg truncate">Pharmacy Management System</h1>
              </div>
              <Button variant="outline" onClick={signOut} className="ml-2 shrink-0">
                <LogOut className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </header>
            <main className="flex-1 p-3 sm:p-4 lg:p-6 bg-background overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};
