import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Sale {
  id: string;
  created_at: string;
  total_amount: number;
  payment_method: string;
  user_id: string;
  profiles?: { full_name: string } | null;
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  drug_id: string;
  drugs?: { name: string; manufacturer: string } | null;
}

const Sales = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          total_amount,
          payment_method,
          user_id,
          profiles:user_id(*)  -- join via foreign key
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        toast.error('Failed to fetch sales');
      } else {
        // Ensure profiles is always a single object
        const formattedData = data?.map((sale: any) => ({
          ...sale,
          profiles: sale.profiles || null,
        })) || [];
        setSales(formattedData);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
    setLoading(false);
  };

  const fetchSaleItems = async (saleId: string) => {
    setItemsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_items')
        .select(`
          id,
          quantity,
          unit_price,
          subtotal,
          drug_id,
          drugs:drug_id(*)  -- join via foreign key
        `)
        .eq('sale_id', saleId);

      if (error) {
        console.error('Error fetching sale items:', error);
        toast.error('Failed to fetch sale items');
      } else {
        // Ensure drugs is always a single object
        const formattedItems = data?.map((item: any) => ({
          ...item,
          drugs: item.drugs || null,
        })) || [];
        setSaleItems(formattedItems);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An error occurred');
    }
    setItemsLoading(false);
  };

  const handleViewDetails = (sale: Sale) => {
    setSelectedSale(sale);
    fetchSaleItems(sale.id);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">All Sales</h2>
        <p className="text-sm sm:text-base text-muted-foreground">View all sales transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Complete list of all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-center text-sm sm:text-base text-muted-foreground p-8">No sales found.</p>
          ) : (
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">Date & Time</TableHead>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">Staff Member</TableHead>
                    <TableHead className="text-xs sm:text-sm whitespace-nowrap">Payment Method</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Amount</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                        {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell className="text-xs sm:text-sm">
                        {sale.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="capitalize text-xs sm:text-sm">{sale.payment_method || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
                        KSH {Number(sale.total_amount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(sale)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-base sm:text-lg">Sale Details</DialogTitle>
                              <DialogDescription>
                                Sale on {format(new Date(sale.created_at), 'PPP')} at{' '}
                                {format(new Date(sale.created_at), 'p')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-3 sm:space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Staff Member</p>
                                  <p className="font-medium text-sm sm:text-base">
                                    {sale.profiles?.full_name || 'N/A'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs sm:text-sm font-medium text-muted-foreground">Payment Method</p>
                                  <Badge variant="outline" className="capitalize text-xs sm:text-sm">
                                    {sale.payment_method || 'N/A'}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">Items Sold</p>
                                {itemsLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  </div>
                                ) : (
                                  <div className="border rounded-lg overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead className="text-xs sm:text-sm">Drug</TableHead>
                                          <TableHead className="text-xs sm:text-sm hidden sm:table-cell">Manufacturer</TableHead>
                                          <TableHead className="text-right text-xs sm:text-sm">Qty</TableHead>
                                          <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Unit Price</TableHead>
                                          <TableHead className="text-right text-xs sm:text-sm">Subtotal</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                         {saleItems.map((item) => {
                                           const drug = item.drugs;
                                           return (
                                          <TableRow key={item.id}>
                                            <TableCell className="font-medium text-xs sm:text-sm">
                                              {drug?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-xs sm:text-sm hidden sm:table-cell">
                                              {drug?.manufacturer || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right text-xs sm:text-sm">{item.quantity}</TableCell>
                                             <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">
                                              KSH {Number(item.unit_price).toFixed(2)}
                                             </TableCell>
                                             <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
                                              KSH {Number(item.subtotal).toFixed(2)}
                                              </TableCell>
                                           </TableRow>
                                         );
                                         })}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end pt-3 sm:pt-4 border-t">
                                <div>
                                   <p className="text-xs sm:text-sm font-medium text-muted-foreground">Total Amount</p>
                                  <p className="text-xl sm:text-2xl font-bold">KSH {Number(sale.total_amount).toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
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

export default Sales;
