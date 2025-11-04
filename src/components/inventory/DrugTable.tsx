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
import { EditDrugDialog } from './EditDrugDialog';

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
  const [editingDrug, setEditingDrug] = useState<Drug | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

const handleDelete = async (id: string) => {
  try {
    setDeletingId(id);

    // 1️⃣ Unlink all related sales first
    console.log(`[Delete] Unlinking sale_items for drug: ${id}`);
    const { error: unlinkError } = await supabase
      .from('sale_items')
      .update({ drug_id: null })
      .eq('drug_id', id);

    if (unlinkError) {
      console.error('Error unlinking sale_items:', unlinkError);
      toast.error('Could not unlink sales before deleting drug');
      setDeletingId(null);
      return;
    }

    // 2️⃣ Double-check that sales are unlinked
    const { data: linkedSales, error: checkError } = await supabase
      .from('sale_items')
      .select('id')
      .eq('drug_id', id);

    if (checkError) {
      console.error('Error checking linked sales:', checkError);
    } else if (linkedSales.length > 0) {
      console.warn('Sales still linked — delete will fail.');
      toast.error('Sales still linked, delete blocked.');
      setDeletingId(null);
      return;
    }

    // 3️⃣ Now safely delete the drug
    console.log(`[Delete] Attempting to delete drug: ${id}`);
    const { error: deleteError } = await supabase
      .from('drugs')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting drug:', deleteError);
      toast.error('Failed to delete drug');
    } else {
      toast.success('Drug deleted successfully');
      onUpdate();
    }
  } catch (err) {
    console.error('Unexpected error deleting drug:', err);
    toast.error('Unexpected error occurred');
  } finally {
    setDeletingId(null);
  }
};




  const isLowStock = (quantity: number, threshold: number) => quantity <= threshold;
  const isExpiringSoon = (expiryDate: string) => {
    const days = Math.floor((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days <= 60 && days >= 0;
  };

  const handleEdit = (drug: Drug) => {
    setEditingDrug(drug);
    setEditDialogOpen(true);
  };

  return (
    <>
      <EditDrugDialog
        drug={editingDrug}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onUpdate={onUpdate}
      />
      <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap">Name</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden md:table-cell">Manufacturer</TableHead>
            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Purchase Price</TableHead>
            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Selling Price</TableHead>
            <TableHead className="text-right text-xs sm:text-sm">Qty</TableHead>
            <TableHead className="text-xs sm:text-sm whitespace-nowrap hidden lg:table-cell">Expiry Date</TableHead>
            <TableHead className="text-xs sm:text-sm">Status</TableHead>
            <TableHead className="text-right text-xs sm:text-sm whitespace-nowrap">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {drugs.map((drug) => (
            <TableRow key={drug.id}>
              <TableCell className="font-medium text-xs sm:text-sm">{drug.name}</TableCell>
              <TableCell className="text-xs sm:text-sm hidden md:table-cell">{drug.manufacturer}</TableCell>
              <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">KSH {Number(drug.purchase_price).toFixed(2)}</TableCell>
              <TableCell className="text-right text-xs sm:text-sm whitespace-nowrap">KSH {Number(drug.selling_price).toFixed(2)}</TableCell>
              <TableCell className="text-right text-xs sm:text-sm">
                <span className={isLowStock(drug.quantity, drug.low_stock_threshold) ? 'text-destructive font-semibold' : ''}>
                  {drug.quantity}
                </span>
              </TableCell>
              <TableCell className="text-xs sm:text-sm hidden lg:table-cell">{format(new Date(drug.expiry_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {isLowStock(drug.quantity, drug.low_stock_threshold) && (
                    <Badge variant="destructive" className="text-xs">Low Stock</Badge>
                  )}
                  {isExpiringSoon(drug.expiry_date) && (
                    <Badge variant="outline" className="border-orange-500 text-orange-500 text-xs">Expiring</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1 sm:gap-2">
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleEdit(drug)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="ghost"
                    onClick={() => handleDelete(drug.id)}
                    disabled={deletingId === drug.id}
                    className="h-8 w-8"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
};
