import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { DollarSign, Package, ShoppingCart, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

const Reports = () => {
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return format(date, 'yyyy-MM-dd');
  });
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    totalItems: 0,
    avgSaleValue: 0,
  });
  const [dailyData, setDailyData] = useState<any[]>([]);

  const fetchReports = async () => {
    setLoading(true);
    
    const { data: sales, error } = await (supabase as any)
      .from('sales')
      .select(`
        id,
        created_at,
        total_amount,
        payment_method,
        profiles!sales_user_id_fkey(full_name)
      `)
      .gte('created_at', new Date(dateFrom).toISOString())
      .lte('created_at', new Date(dateTo + 'T23:59:59').toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching sales:', error);
    } else {
      setSalesData(sales || []);
      
      // Calculate stats
      const totalRevenue = (sales || []).reduce((sum: number, sale: any) => sum + Number(sale.total_amount), 0);
      const totalSales = (sales || []).length;
      
      // Fetch total items sold
      const saleIds = (sales || []).map((s: any) => s.id);
      let totalItems = 0;
      
      if (saleIds.length > 0) {
        const { data: items } = await (supabase as any)
          .from('sale_items')
          .select('quantity')
          .in('sale_id', saleIds);
        
        totalItems = (items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
      }
      
      setStats({
        totalSales,
        totalRevenue,
        totalItems,
        avgSaleValue: totalSales > 0 ? totalRevenue / totalSales : 0,
      });

      // Group sales by day
      const dailyGroups = (sales || []).reduce((acc: any, sale: any) => {
        const day = format(new Date(sale.created_at), 'yyyy-MM-dd');
        if (!acc[day]) {
          acc[day] = { date: day, sales: 0, revenue: 0 };
        }
        acc[day].sales += 1;
        acc[day].revenue += Number(sale.total_amount);
        return acc;
      }, {});

      setDailyData(Object.values(dailyGroups).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
    }
    
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Reports & Analytics</h2>
        <p className="text-muted-foreground">View sales reports and business insights</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range Filter</CardTitle>
          <CardDescription>Select a date range to view reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="dateFrom">From</Label>
              <Input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="dateTo">To</Label>
              <Input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <Button onClick={fetchReports} disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Sale Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgSaleValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daily Sales Summary</CardTitle>
          <CardDescription>Sales breakdown by day</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : dailyData.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No sales data available.</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Sales Count</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => (
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{format(new Date(day.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">{day.sales}</TableCell>
                      <TableCell className="text-right font-medium">${day.revenue.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
          <CardDescription>Detailed sales transactions for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : salesData.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No sales found for the selected period.</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salesData.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>{format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                      <TableCell>{sale.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{sale.payment_method || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">${Number(sale.total_amount).toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Reports;
