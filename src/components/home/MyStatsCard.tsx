import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, ShoppingBag, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const MyStatsCard = () => {
  const { user } = useAuth();
  const [todayStats, setTodayStats] = useState({
    salesCount: 0,
    totalAmount: 0,
    itemsSold: 0
  });
  const [weekStats, setWeekStats] = useState({
    salesCount: 0,
    totalAmount: 0,
    itemsSold: 0
  });
  const [allTimeStats, setAllTimeStats] = useState({
    salesCount: 0,
    totalAmount: 0,
    itemsSold: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      weekAgo.setHours(0, 0, 0, 0);

      // Fetch today's sales
      const { data: todaySales } = await (supabase as any)
        .from('sales')
        .select('id, total_amount')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      // Fetch this week's sales
      const { data: weekSales } = await (supabase as any)
        .from('sales')
        .select('id, total_amount')
        .eq('user_id', user.id)
        .gte('created_at', weekAgo.toISOString());

      // Fetch all-time sales
      const { data: allSales } = await (supabase as any)
        .from('sales')
        .select('id, total_amount')
        .eq('user_id', user.id);

      // Calculate today stats
      const todaySalesCount = todaySales?.length || 0;
      const todayTotalAmount = todaySales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
      let todayItemsSold = 0;

      if (todaySales && todaySales.length > 0) {
        const { data: items } = await (supabase as any)
          .from('sale_items')
          .select('quantity')
          .in('sale_id', todaySales.map((s: any) => s.id));
        todayItemsSold = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }

      // Calculate week stats
      const weekSalesCount = weekSales?.length || 0;
      const weekTotalAmount = weekSales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
      let weekItemsSold = 0;

      if (weekSales && weekSales.length > 0) {
        const { data: items } = await (supabase as any)
          .from('sale_items')
          .select('quantity')
          .in('sale_id', weekSales.map((s: any) => s.id));
        weekItemsSold = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }

      // Calculate all-time stats
      const allSalesCount = allSales?.length || 0;
      const allTotalAmount = allSales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;
      let allItemsSold = 0;

      if (allSales && allSales.length > 0) {
        const { data: items } = await (supabase as any)
          .from('sale_items')
          .select('quantity')
          .in('sale_id', allSales.map((s: any) => s.id));
        allItemsSold = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }

      setTodayStats({ salesCount: todaySalesCount, totalAmount: todayTotalAmount, itemsSold: todayItemsSold });
      setWeekStats({ salesCount: weekSalesCount, totalAmount: weekTotalAmount, itemsSold: weekItemsSold });
      setAllTimeStats({ salesCount: allSalesCount, totalAmount: allTotalAmount, itemsSold: allItemsSold });
      setLoading(false);
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Stats Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const renderStatsGrid = (stats: typeof todayStats) => (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <ShoppingBag className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Sales</p>
          <p className="text-2xl font-bold">{stats.salesCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <DollarSign className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Revenue</p>
          <p className="text-2xl font-bold">KSH {stats.totalAmount.toFixed(2)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 border rounded-lg">
        <Package className="h-8 w-8 text-primary" />
        <div>
          <p className="text-sm text-muted-foreground">Items Sold</p>
          <p className="text-2xl font-bold">{stats.itemsSold}</p>
        </div>
      </div>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Performance Stats</CardTitle>
        <CardDescription>View your sales performance across different time periods</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="today" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
          <TabsContent value="today" className="mt-4">
            {renderStatsGrid(todayStats)}
          </TabsContent>
          <TabsContent value="week" className="mt-4">
            {renderStatsGrid(weekStats)}
          </TabsContent>
          <TabsContent value="all" className="mt-4">
            {renderStatsGrid(allTimeStats)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
