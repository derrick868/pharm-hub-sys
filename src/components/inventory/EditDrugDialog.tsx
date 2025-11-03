import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface EditDrugDialogProps {
  drug: Drug | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export const EditDrugDialog = ({ drug, open, onOpenChange, onUpdate }: EditDrugDialogProps) => {
  const [formData, setFormData] = useState({
    name: '',
    manufacturer: '',
    selling_price: '',
    purchase_price: '',
    quantity: '',
    low_stock_threshold: '',
    expiry_date: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (drug) {
      setFormData({
        name: drug.name,
        manufacturer: drug.manufacturer,
        selling_price: drug.selling_price.toString(),
        purchase_price: drug.purchase_price.toString(),
        quantity: drug.quantity.toString(),
        low_stock_threshold: drug.low_stock_threshold.toString(),
        expiry_date: drug.expiry_date,
      });
    }
  }, [drug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!drug) return;

    setLoading(true);
    const { error } = await (supabase as any)
      .from('drugs')
      .update({
        name: formData.name,
        manufacturer: formData.manufacturer,
        selling_price: parseFloat(formData.selling_price),
        purchase_price: parseFloat(formData.purchase_price),
        quantity: parseInt(formData.quantity),
        low_stock_threshold: parseInt(formData.low_stock_threshold),
        expiry_date: formData.expiry_date,
      })
      .eq('id', drug.id);

    if (error) {
      toast.error('Failed to update drug');
      console.error('Error updating drug:', error);
    } else {
      toast.success('Drug updated successfully');
      onUpdate();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Drug</DialogTitle>
          <DialogDescription>Update the drug information below</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Drug Name</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-manufacturer">Manufacturer</Label>
            <Input
              id="edit-manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-purchase-price">Purchase Price (KSH)</Label>
              <Input
                id="edit-purchase-price"
                type="number"
                step="0.01"
                value={formData.purchase_price}
                onChange={(e) => setFormData({ ...formData, purchase_price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-selling-price">Selling Price (KSH)</Label>
              <Input
                id="edit-selling-price"
                type="number"
                step="0.01"
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-threshold">Low Stock Alert</Label>
              <Input
                id="edit-threshold"
                type="number"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-expiry">Expiry Date</Label>
            <Input
              id="edit-expiry"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
              required
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Drug'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
