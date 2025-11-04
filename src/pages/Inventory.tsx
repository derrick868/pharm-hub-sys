import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { AddDrugDialog } from '@/components/inventory/AddDrugDialog';
import { DrugTable } from '@/components/inventory/DrugTable';
import { supabase } from '@/integrations/supabase/client';

const Inventory = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [drugs, setDrugs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrugs = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('drugs')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching drugs:', error);
    } else {
      setDrugs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchDrugs();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventory Management</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Manage your drug inventory</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Drug
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search drugs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 text-sm sm:text-base"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      ) : drugs.length === 0 ? (
        <div className="border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">No drugs in inventory yet. Click "Add Drug" to get started.</p>
        </div>
      ) : (
        <DrugTable 
          drugs={drugs.filter(drug => 
            drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            drug.manufacturer.toLowerCase().includes(searchQuery.toLowerCase())
          )} 
          onUpdate={fetchDrugs}
        />
      )}

      <AddDrugDialog open={showAddDialog} onOpenChange={setShowAddDialog} onSuccess={fetchDrugs} />
    </div>
  );
};

export default Inventory;
