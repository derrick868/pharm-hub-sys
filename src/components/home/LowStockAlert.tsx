import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle } from 'lucide-react';

interface Drug {
  id: string;
  name: string;
  quantity: number;
  low_stock_threshold: number;
}

export const LowStockAlert = () => {
  const [lowStockDrugs, setLowStockDrugs] = useState<Drug[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLowStock = async () => {
      const { data, error } = await (supabase as any)
        .from('drugs')
        .select('id, name, quantity, low_stock_threshold')
        .order('quantity', { ascending: true });

      if (error) {
        console.error('Error fetching low stock drugs:', error);
      } else {
        // Filter low stock items
        const filtered = (data || []).filter((drug: Drug) => 
          drug.quantity <= drug.low_stock_threshold
        ).slice(0, 5);
        setLowStockDrugs(filtered);
      }
      setLoading(false);
    };

    fetchLowStock();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (lowStockDrugs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Low Stock Alerts</CardTitle>
          <CardDescription>All items are well stocked</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No low stock items at this time.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Low Stock Alerts
        </CardTitle>
        <CardDescription>Items that need restocking</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowStockDrugs.map((drug) => (
            <div key={drug.id} className="flex justify-between items-center p-2 border rounded">
              <span className="font-medium">{drug.name}</span>
              <span className="text-sm text-destructive">
                {drug.quantity} / {drug.low_stock_threshold}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
