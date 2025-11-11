import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, AlertTriangle, DollarSign, TrendingUp, XCircle, Clock } from 'lucide-react';
import dayjs from 'dayjs';

const Dashboard = () => {
  const [stockValue, setStockValue] = useState(0);
  const [salesValue, setSalesValue] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [totalDrugs, setTotalDrugs] = useState(0);
  const [expiringDrugsList, setExpiringDrugsList] = useState([]);
  const [lossValue, setLossValue] = useState(0);

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
        const value = drugs.reduce(
          (sum, d) => sum + (Number(d.purchase_price) || 0) * (d.quantity || 0),
          0
        );
        setStockValue(value);

        // Low stock items
        const low = drugs.filter((d) => d.quantity < (d.low_stock_threshold || 10)).length;
        setLowStock(low);

        // Drugs expiring in next 60 days
        const today = dayjs();
        const expiringList = drugs
          .filter(
            (d) =>
              d.expiry_date &&
              dayjs(d.expiry_date).isAfter(today) &&
              dayjs(d.expiry_date).diff(today, 'day') <= 60
          )
          .sort((a, b) => dayjs(a.expiry_date).diff(dayjs(b.expiry_date)));

        setExpiringDrugsList(expiringList);
      }

      // Fetch sales (for the past 30 days)
      const thirtyDaysAgo = dayjs().subtract(30, 'day').format('YYYY-MM-DD');
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('total_amount, created_at')
        .gte('created_at', thirtyDaysAgo);

      if (!salesError && sales) {
        const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
        setSalesValue(totalSales);
      }

      // Calculate losses from sale_items (if prices changed)
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('quantity, unit_price, drug_id');

      if (!saleItemsError && saleItems && drugs) {
        let totalLoss = 0;

        saleItems.forEach((item) => {
          const drug = drugs.find((d) => d.id === item.drug_id);
          if (drug) {
            const costPrice = Number(drug.purchase_price) || 0;
            const sellingPrice = Number(item.unit_price) || 0;
            if (sellingPrice < costPrice) {
              totalLoss += (costPrice - sellingPrice) * (item.quantity || 0);
            }
          }
        });

        setLossValue(totalLoss);
      }
    };

    loadDashboardData();
  }, []);

  // Helper for expiry icon & color
  const getExpiryInfo = (daysLeft) => {
    if (daysLeft <= 10)
      return { color: 'text-red-500', icon: <XCircle className="h-4 w-4 text-red-500" />, label: 'Critical' };
    if (daysLeft <= 30)
      return { color: 'text-orange-500', icon: <AlertTriangle className="h-4 w-4 text-orange-500" />, label: 'Warning' };
    return { color: 'text-green-500', icon: <Clock className="h-4 w-4 text-green-500" />, label: 'Safe' };
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to Amiko Plas Medical Clinic</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">KSH {stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on purchase price</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (30 Days)</CardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">KSH {salesValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days revenue</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loss Encountered</CardTitle>
            <XCircle className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">KSH {lossValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Selling below cost</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{lowStock}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
            <Package className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-700">{totalDrugs}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Drugs List */}
      <Card>
        <CardHeader>
          <CardTitle>⚠️ Drugs Nearing Expiry (Next 60 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          {expiringDrugsList.length > 0 ? (
            <ul className="divide-y divide-muted max-h-64 overflow-y-auto">
              {expiringDrugsList.map((drug) => {
                const daysLeft = dayjs(drug.expiry_date).diff(dayjs(), 'day');
                const { color, icon, label } = getExpiryInfo(daysLeft);
                return (
                  <li key={drug.id} className="py-2 flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      {icon}
                      <span className="font-medium">{drug.name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`block text-sm ${color} font-semibold`}>
                        {dayjs(drug.expiry_date).format('DD MMM YYYY')}
                      </span>
                      <span className="text-xs text-muted-foreground">{label} ({daysLeft} days left)</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8 text-muted-foreground">✅ No drugs expiring soon</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
