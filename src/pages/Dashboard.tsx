import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingUp } from 'lucide-react';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [stockValue, setStockValue] = useState(0);
  const [salesValue, setSalesValue] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [totalDrugs, setTotalDrugs] = useState(0);
  const [expiringDrugs, setExpiringDrugs] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
      // Fetch all drugs
      const { data: drugs, error: drugsError } = await supabase.from('drugs').select('*');
      if (drugsError) {
        console.error('Error fetching drugs:', drugsError);
        return;
      }

      if (drugs) {
        setTotalDrugs(drugs.length);

        // Total stock value
        const value = drugs.reduce((sum, d) => sum + (Number(d.purchase_price) || 0) * (d.quantity || 0), 0);
        setStockValue(value);

        // Low stock items
        const low = drugs.filter((d) => d.quantity < (d.low_stock_threshold || 10)).length;
        setLowStock(low);

        // Drugs expiring in next 60 days
        const today = dayjs();
        const expiring = drugs.filter(
          (d) => d.expiry_date && dayjs(d.expiry_date).diff(today, 'day') <= 60
        ).length;
        setExpiringDrugs(expiring);
      }

      // Fetch sales in last 30 days (if you have a `sales` table)
      const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, created_at')
        .gte('created_at', thirtyDaysAgo);

      if (!salesError && sales) {
        const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        setSalesValue(totalSales);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your pharmacy management system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on purchase price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (30 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {salesValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrugs}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Drugs Nearing Expiry (Next 60 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            {expiringDrugs > 0
              ? `${expiringDrugs} drug(s) expiring soon`
              : 'No drugs expiring soon'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
