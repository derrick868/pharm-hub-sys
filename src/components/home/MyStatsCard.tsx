import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { DollarSign, ShoppingBag, Package } from 'lucide-react';

export const MyStatsCard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
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

      // Fetch today's sales for current user
      const { data: sales, error } = await (supabase as any)
        .from('sales')
        .select('id, total_amount')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString());

      if (error) {
        console.error('Error fetching sales:', error);
        setLoading(false);
        return;
      }

      const salesCount = sales?.length || 0;
      const totalAmount = sales?.reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0) || 0;

      // Fetch items sold count
      const saleIds = sales?.map((s: any) => s.id) || [];
      let itemsSold = 0;

      if (saleIds.length > 0) {
        const { data: items } = await (supabase as any)
          .from('sale_items')
          .select('quantity')
          .in('sale_id', saleIds);

        itemsSold = items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
      }

      setStats({ salesCount, totalAmount, itemsSold });
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Stats Today</CardTitle>
        <CardDescription>Your performance summary</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
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
            <p className="text-2xl font-bold">${stats.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 border rounded-lg">
          <Package className="h-8 w-8 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Items Sold</p>
            <p className="text-2xl font-bold">{stats.itemsSold}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
