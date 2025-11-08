import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Search, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editFormData, setEditFormData] = useState({
    payment_method: '',
    total_amount: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
            profiles!sales_user_id_fkey(full_name)
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
        .select('id, quantity, unit_price, subtotal, drug_id, drugs!sale_items_drug_id_fkey(name, manufacturer)')
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

  // Handle edit
  const handleEdit = (sale: Sale) => {
    setEditingSale(sale);
    setEditFormData({
      payment_method: sale.payment_method || '',
      total_amount: Number(sale.total_amount),
    });
    setEditDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (saleId: string) => {
    if (!confirm('Are you sure you want to delete this sale? This action cannot be undone.')) return;

    try {
      // Delete sale items first (foreign key constraint)
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Delete sale
      const { error: saleError } = await supabase
        .from('sales')
        .delete()
        .eq('id', saleId);

      if (saleError) throw saleError;

      toast.success('Sale deleted successfully');
      setSales(sales.filter(s => s.id !== saleId));
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast.error('Failed to delete sale');
    }
  };

  // Handle update sale
  const handleUpdateSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    try {
      const { error } = await supabase
        .from('sales')
        .update({
          payment_method: editFormData.payment_method,
          total_amount: editFormData.total_amount,
        })
        .eq('id', editingSale.id);

      if (error) throw error;

      toast.success('Sale updated successfully');
      setSales(sales.map(s => 
        s.id === editingSale.id 
          ? { ...s, payment_method: editFormData.payment_method, total_amount: editFormData.total_amount }
          : s
      ));
      setEditDialogOpen(false);
      setEditingSale(null);
    } catch (error) {
      console.error('Error updating sale:', error);
      toast.error('Failed to update sale');
    }
  };

  // Filter sales
  const filteredSales = sales.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    const staffName = Array.isArray(sale.profiles)
      ? sale.profiles[0]?.full_name || ''
      : sale.profiles?.full_name || '';
    const paymentMethod = sale.payment_method || '';
    const amount = sale.total_amount.toString();
    
    return (
      staffName.toLowerCase().includes(searchLower) ||
      paymentMethod.toLowerCase().includes(searchLower) ||
      amount.includes(searchLower)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

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

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by staff, payment method, or amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

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
                  {paginatedSales.map((sale) => (
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
                        <div className="flex justify-end gap-2">
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(sale)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(sale.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredSales.length)} of {filteredSales.length} results
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => setCurrentPage(page)}
                          className="w-8 h-8 p-0"
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      {/* Edit Sale Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateSale} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Input
                id="payment_method"
                value={editFormData.payment_method}
                onChange={(e) => setEditFormData({ ...editFormData, payment_method: e.target.value })}
                placeholder="e.g., cash, mpesa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="total_amount">Total Amount (KSH)</Label>
              <Input
                id="total_amount"
                type="number"
                step="0.01"
                value={editFormData.total_amount}
                onChange={(e) => setEditFormData({ ...editFormData, total_amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Update Sale
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
