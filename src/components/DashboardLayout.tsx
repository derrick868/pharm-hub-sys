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
            <header className="h-14 border-b flex items-center justify-between px-4 bg-card">
              <div className="flex items-center">
                <SidebarTrigger />
                <h1 className="ml-4 font-semibold text-lg">Pharmacy Management System</h1>
              </div>
              <Button variant="outline" onClick={signOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </header>
            <main className="flex-1 p-6 bg-background overflow-auto">
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
};
