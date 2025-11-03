import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ShoppingCart, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Drug {
  id: string;
  name: string;
  manufacturer: string;
  quantity: number;
  selling_price: number;
}

interface CartItem {
  drug: Drug;
  quantity: number;
}

const POS = () => {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDrugs();
  }, []);

  const fetchDrugs = async () => {
    const { data, error } = await (supabase as any)
      .from('drugs')
      .select('*')
      .gt('quantity', 0)
      .order('name');

    if (error) {
      toast.error('Failed to fetch drugs');
      return;
    }

    setDrugs(data || []);
  };

  const filteredDrugs = drugs.filter(drug =>
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (drug: Drug) => {
    const existingItem = cart.find(item => item.drug.id === drug.id);
    
    if (existingItem) {
      if (existingItem.quantity >= drug.quantity) {
        toast.error('Not enough stock available');
        return;
      }
      setCart(cart.map(item =>
        item.drug.id === drug.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { drug, quantity: 1 }]);
    }
    toast.success(`${drug.name} added to cart`);
  };

  const updateQuantity = (drugId: string, newQuantity: number) => {
    const item = cart.find(item => item.drug.id === drugId);
    if (!item) return;

    if (newQuantity <= 0) {
      removeFromCart(drugId);
      return;
    }

    if (newQuantity > item.drug.quantity) {
      toast.error('Not enough stock available');
      return;
    }

    setCart(cart.map(item =>
      item.drug.id === drugId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  const removeFromCart = (drugId: string) => {
    setCart(cart.filter(item => item.drug.id !== drugId));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.drug.selling_price * item.quantity), 0);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please log in to process sales');
        setLoading(false);
        return;
      }

      // Create sale record
      const { data: sale, error: saleError } = await (supabase as any)
        .from('sales')
        .insert({
          user_id: user.id,
          total_amount: calculateTotal(),
          payment_method: paymentMethod
        })
        .select()
        .single();

      if (saleError || !sale) throw saleError;

      // Create sale items
      const saleItems = cart.map(item => ({
        sale_id: sale.id,
        drug_id: item.drug.id,
        quantity: item.quantity,
        unit_price: item.drug.selling_price,
        subtotal: item.drug.selling_price * item.quantity
      }));

      const { error: itemsError } = await (supabase as any)
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update drug quantities
      for (const item of cart) {
        const { error: updateError } = await (supabase as any)
          .from('drugs')
          .update({ quantity: item.drug.quantity - item.quantity })
          .eq('id', item.drug.id);

        if (updateError) throw updateError;
      }

      toast.success('Sale completed successfully');
      setCart([]);
      fetchDrugs();
    } catch (error: any) {
      toast.error('Failed to process sale: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Point of Sale</h2>
        <p className="text-muted-foreground">Process drug sales</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Products Section */}
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {filteredDrugs.map(drug => (
                <div
                  key={drug.id}
                  className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent cursor-pointer"
                  onClick={() => addToCart(drug)}
                >
                  <div>
                    <p className="font-medium">{drug.name}</p>
                    <p className="text-sm text-muted-foreground">{drug.manufacturer}</p>
                    <p className="text-sm text-muted-foreground">Stock: {drug.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">KSH {drug.selling_price.toFixed(2)}</p>
                    <Button size="sm" variant="outline">Add</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cart Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {cart.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Cart is empty</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map(item => (
                      <TableRow key={item.drug.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{item.drug.name}</p>
                            <p className="text-xs text-muted-foreground">{item.drug.manufacturer}</p>
                          </div>
                        </TableCell>
                        <TableCell>KSH {item.drug.selling_price.toFixed(2)}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            max={item.drug.quantity}
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.drug.id, parseInt(e.target.value))}
                            className="w-16"
                          />
                        </TableCell>
                        <TableCell>KSH {(item.drug.selling_price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.drug.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>KSH {calculateTotal().toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Payment Method</label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile">Mobile Payment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full"
                    onClick={processSale}
                    disabled={loading}
                  >
                    {loading ? 'Processing...' : 'Complete Sale'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default POS;
