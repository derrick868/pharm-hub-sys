import { useState } from 'react';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Drug {
  id: string;
  name: string;
  manufacturer: string;
  selling_price: number;
  purchase_price: number;
  quantity: number;
  low_stock_threshold: number;
  expiry_date: string;
}

interface DrugTableProps {
  drugs: Drug[];
  onUpdate: () => void;
}

export const DrugTable = ({ drugs, onUpdate }: DrugTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    const { error } = await (supabase as any)
      .from('drugs')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete drug');
      console.error('Error deleting drug:', error);
    } else {
      toast.success('Drug deleted successfully');
      onUpdate();
    }
    setDeletingId(null);
  };

  const isLowStock = (quantity: number, threshold: number) => quantity <= threshold;
  const isExpiringSoon = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 60 && days >= 0;
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Manufacturer</TableHead>
            <TableHead className="text-right">Purchase Price</TableHead>
            <TableHead className="text-right">Selling Price</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drugs.map((drug) => (
            <TableRow key={drug.id}>
              <TableCell className="font-medium">{drug.name}</TableCell>
              <TableCell>{drug.manufacturer}</TableCell>
              <TableCell className="text-right">${Number(drug.purchase_price).toFixed(2)}</TableCell>
              <TableCell className="text-right">${Number(drug.selling_price).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <span className={isLowStock(drug.quantity, drug.low_stock_threshold) ? 'text-destructive font-semibold' : ''}>
                  {drug.quantity}
                </span>
              </TableCell>
              <TableCell>{format(new Date(drug.expiry_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {isLowStock(drug.quantity, drug.low_stock_threshold) && (
                    <Badge variant="destructive">Low Stock</Badge>
                  )}
                  {isExpiringSoon(drug.expiry_date) && (
                    <Badge variant="outline" className="border-orange-500 text-orange-500">Expiring Soon</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button size="icon" variant="ghost">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleDelete(drug.id)}
                    disabled={deletingId === drug.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
