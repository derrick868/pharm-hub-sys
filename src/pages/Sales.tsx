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
  profiles?: { full_name: string };
}

interface SaleItem {
  id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  drugs: { name: string; manufacturer: string };
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
          profiles!sales_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching sales:', error);
        toast.error('Failed to fetch sales');
      } else {
        setSales(data || []);
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
          drugs(name, manufacturer)
        `)
        .eq('sale_id', saleId);

      if (error) {
        console.error('Error fetching sale items:', error);
        toast.error('Failed to fetch sale items');
      } else {
        setSaleItems(data || []);
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">All Sales</h2>
        <p className="text-muted-foreground">View all sales transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales History</CardTitle>
          <CardDescription>Complete list of all sales transactions</CardDescription>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <p className="text-center text-muted-foreground p-8">No sales found.</p>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Payment Method</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(sale.created_at), 'MMM dd, yyyy HH:mm')}
                      </TableCell>
                      <TableCell>{sale.profiles?.full_name || 'N/A'}</TableCell>
                      <TableCell className="capitalize">{sale.payment_method || 'N/A'}</TableCell>
                      <TableCell className="text-right font-medium">
                        ${Number(sale.total_amount).toFixed(2)}
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
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Sale Details</DialogTitle>
                              <DialogDescription>
                                Sale on {format(new Date(sale.created_at), 'PPP')} at{' '}
                                {format(new Date(sale.created_at), 'p')}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Staff Member</p>
                                  <p className="font-medium">{sale.profiles?.full_name || 'N/A'}</p>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                                  <Badge variant="outline" className="capitalize">
                                    {sale.payment_method || 'N/A'}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-2">Items Sold</p>
                                {itemsLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                  </div>
                                ) : (
                                  <div className="border rounded-lg">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Drug</TableHead>
                                          <TableHead>Manufacturer</TableHead>
                                          <TableHead className="text-right">Quantity</TableHead>
                                          <TableHead className="text-right">Unit Price</TableHead>
                                          <TableHead className="text-right">Subtotal</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {saleItems.map((item) => (
                                          <TableRow key={item.id}>
                                            <TableCell className="font-medium">
                                              {(item as any).drugs?.name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                              {(item as any).drugs?.manufacturer || 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">{item.quantity}</TableCell>
                                            <TableCell className="text-right">
                                              ${Number(item.unit_price).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                              ${Number(item.subtotal).toFixed(2)}
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                      </TableBody>
                                    </Table>
                                  </div>
                                )}
                              </div>

                              <div className="flex justify-end pt-4 border-t">
                                <div>
                                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                                  <p className="text-2xl font-bold">${Number(sale.total_amount).toFixed(2)}</p>
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
