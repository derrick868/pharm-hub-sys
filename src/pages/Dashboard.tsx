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
      // Get all drugs
      const { data: drugs, error: drugsError } = await supabase.from('drugs').select('*');
      if (drugs && !drugsError) {
        setTotalDrugs(drugs.length);

        const value = drugs.reduce((sum, d) => sum + (d.price || 0) * (d.quantity || 0), 0);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to your pharmacy management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH{stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on purchase price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (30 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{salesValue.toFixed(2)}</div>
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
              ? ${expiringDrugs} drug(s) expiring soon
              : 'No drugs expiring soon'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
};
};
};
export default Dashboard;
