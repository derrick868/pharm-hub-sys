import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Sale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  user_id: string;
  profiles?: { full_name: string }[] | { full_name: string } | null;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  drug_id: string;
  drugs?: { name: string; manufacturer: string }[] | { name: string; manufacturer: string } | null;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);

  // Fetch Sales Data
  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select(`
            id, 
            created_at, 
            total_amount, 
            payment_method, 
            user_id,
            profiles(full_name)
          `)
          .gte('created_at', thirtyDaysAgo.toISOString())
          .order('created_at', { ascending: false });

        if (salesError) {
          console.error('Error fetching sales:', salesError);
          toast.error('Error fetching sales data');
        } else {
          setSales(salesData || []);
        }
      } catch (error) {
        console.error('Error fetching sales:', error);
        toast.error('An error occurred while fetching sales data');
      }
      setLoading(false);
    };

    fetchSalesData();
  }, []);

  // Fetch Sale Items
  const fetchSaleItems = async (saleId: string) => {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select('id, quantity, unit_price, subtotal, drug_id, drugs(name, manufacturer)')
        .eq('sale_id', saleId);

      if (error) {
        console.error('Error fetching sale items:', error);
        toast.error('Error fetching sale items');
      } else {
        setSaleItems(data || []);
      }
    } catch (error) {
      console.error('Error fetching sale items:', error);
      toast.error('An error occurred while fetching sale items');
    }
    setItemsLoading(false);
  };

  // Handle opening Sale details dialog
  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    fetchSaleItems(sale.id);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Sales History</h2>
        <p className="text-muted-foreground">View all sales transactions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sales.length === 0 ? (
          <p className="text-center text-sm sm:text-base text-muted-foreground p-8">No sales found in the last 30 days.</p>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Total Sales (Last 30 Days)</CardTitle>
              <CardDescription>Summary of all sales transactions</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">Date & Time</TableHead>
                    <TableHead className="text-xs sm:text-sm">Staff Member</TableHead>
                    <TableHead className="text-xs sm:text-sm">Payment Method</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Amount</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                        {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {Array.isArray(sale.profiles)
                          ? sale.profiles[0]?.full_name || 'N/A'
                          : sale.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm">{sale.payment_method || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm">
                        KSH {Number(sale.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => handleViewDetails(sale)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Sale Details</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-3 sm:space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm">Staff Member</p>
                                  <p className="font-medium">
                                    {Array.isArray(sale.profiles)
                                      ? sale.profiles[0]?.full_name || 'N/A'
                                      : sale.profiles?.full_name || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm">Payment Method</p>
                                  <Badge variant="outline">{sale.payment_method || 'N/A'}</Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs sm:text-sm">Items Sold</p>
                                {itemsLoading ? (
                                  <div>Loading...</div>
                                ) : (
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="text-xs sm:text-sm">Drug</TableHead>
                                        <TableHead className="text-xs sm:text-sm">Manufacturer</TableHead>
                                        <TableHead className="text-right text-xs sm:text-sm">Qty</TableHead>
                                        <TableHead className="text-right text-xs sm:text-sm">Unit Price</TableHead>
                                        <TableHead className="text-right text-xs sm:text-sm">Subtotal</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {saleItems.map((item) => {
                                        const drugData = Array.isArray(item.drugs) ? item.drugs[0] : item.drugs;
                                        return (
                                          <TableRow key={item.id}>
                                            <TableCell>{drugData?.name || 'N/A'}</TableCell>
                                            <TableCell>{drugData?.manufacturer || 'N/A'}</TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                              KSH {Number(item.unit_price).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                              KSH {Number(item.subtotal).toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                )}
                              </div>

                              <div className="flex justify-end pt-3 sm:pt-4">
                                <p className="text-xl sm:text-2xl font-bold">
                                  Total Amount: KSH {Number(sale.total_amount).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Sales;
