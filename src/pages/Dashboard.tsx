import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Package,
  AlertTriangle,
  DollarSign,
  TrendingUp,
  Clock,
  AlertOctagon,
} from 'lucide-react';
import dayjs from 'dayjs';
import { Badge } from '@/components/ui/badge';

const Dashboard = () => {
  const [stockValue, setStockValue] = useState(0);
  const [salesValue, setSalesValue] = useState(0);
  const [lowStock, setLowStock] = useState(0);
  const [totalDrugs, setTotalDrugs] = useState(0);
  const [expiringDrugsList, setExpiringDrugsList] = useState([]);
  const [expiredDrugsList, setExpiredDrugsList] = useState([]);
  const [expiredLossValue, setExpiredLossValue] = useState(0);

  useEffect(() => {
    const loadDashboardData = async () => {
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

        // Low stock
        const low = drugs.filter((d) => d.quantity < (d.low_stock_threshold || 10)).length;
        setLowStock(low);

        const today = dayjs();

        // Expiring within 60 days
        const expiringList = drugs
          .filter(
            (d) =>
              d.expiry_date &&
              dayjs(d.expiry_date).isAfter(today) &&
              dayjs(d.expiry_date).diff(today, 'day') <= 60
          )
          .sort((a, b) => dayjs(a.expiry_date).diff(dayjs(b.expiry_date)));

        // Expired drugs
        const expiredList = drugs
          .filter((d) => d.expiry_date && dayjs(d.expiry_date).isBefore(today))
          .sort((a, b) => dayjs(a.expiry_date).diff(dayjs(b.expiry_date)));

        // 💸 Calculate loss from expired drugs
        const loss = expiredList.reduce((sum, d) => {
          const price = Number(d.purchase_price) || 0;
          const qty = Number(d.quantity) || 0;
          return sum + price * qty;
        }, 0);

        setExpiringDrugsList(expiringList);
        setExpiredDrugsList(expiredList);
        setExpiredLossValue(loss);
      }

      // Sales for last 30 days
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
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome to Amiko Plas Medical Clinic</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {stockValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Based on purchase price</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Sales (30 Days)</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KSH {salesValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last 30 days revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStock}</div>
            <p className="text-xs text-muted-foreground">Items below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Drugs</CardTitle>
            <Package className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDrugs}</div>
            <p className="text-xs text-muted-foreground">In inventory</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiry & Expired Sections */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Nearing Expiry */}
        <Card className="shadow-lg border-yellow-300">
          <CardHeader className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" /> Drugs Nearing Expiry (Next 60 Days)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-yellow-50 rounded-b-lg">
            {expiringDrugsList.length > 0 ? (
              <ul className="divide-y divide-yellow-200 max-h-72 overflow-y-auto">
                {expiringDrugsList.map((drug) => {
                  const daysLeft = dayjs(drug.expiry_date).diff(dayjs(), 'day');
                  const isCritical = daysLeft <= 10;

                  return (
                    <li
                      key={drug.id}
                      className={`py-3 flex justify-between items-center px-2 rounded-lg transition ${
                        isCritical
                          ? 'bg-red-50 hover:bg-red-100'
                          : 'bg-yellow-100 hover:bg-yellow-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isCritical ? (
                          <AlertOctagon className="h-5 w-5 text-red-600" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        )}
                        <span className="font-medium text-gray-800">{drug.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`text-xs ${
                            isCritical
                              ? 'bg-red-600 hover:bg-red-700'
                              : 'bg-yellow-500 hover:bg-yellow-600'
                          } text-white`}
                        >
                          {isCritical ? 'Expiring Soon' : `${daysLeft} days left`}
                        </Badge>
                        <span
                          className={`text-sm ${
                            isCritical ? 'text-red-600 font-semibold' : 'text-yellow-700'
                          }`}
                        >
                          {dayjs(drug.expiry_date).format('DD MMM YYYY')}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="text-center py-10 text-muted-foreground italic">
                ✅ No drugs nearing expiry
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expired Drugs */}
        <Card className="shadow-lg border-red-400">
          <CardHeader className="bg-gradient-to-r from-red-600 to-red-800 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <AlertOctagon className="h-5 w-5" /> Expired Drugs
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 bg-red-50 rounded-b-lg">
            <div className="mb-3 text-red-700 font-semibold text-sm">
              💸 Total Loss from Expired Drugs: KSH {expiredLossValue.toFixed(2)}
            </div>

            {expiredDrugsList.length > 0 ? (
              <ul className="divide-y divide-red-200 max-h-72 overflow-y-auto">
                {expiredDrugsList.map((drug) => (
                  <li
                    key={drug.id}
                    className="py-3 flex justify-between items-center px-2 rounded-lg bg-red-100 hover:bg-red-200 transition"
                  >
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-red-700" />
                      <span className="font-medium text-gray-800">{drug.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-red-700 hover:bg-red-800 text-white">
                        Expired
                      </Badge>
                      <span className="text-sm text-red-700 font-semibold">
                        {dayjs(drug.expiry_date).format('DD MMM YYYY')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 text-muted-foreground italic">
                🎉 No expired drugs
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
