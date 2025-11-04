import { useAuth } from '@/hooks/useAuth';
import { QuickActionsCard } from '@/components/home/QuickActionsCard';
import { MyStatsCard } from '@/components/home/MyStatsCard';
import { LowStockAlert } from '@/components/home/LowStockAlert';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-sm sm:text-base text-muted-foreground">
          {user?.email || 'Staff Member'}
        </p>
      </div>

      <QuickActionsCard />
      <MyStatsCard />
      <LowStockAlert />
    </div>
  );
};

export default Home;
