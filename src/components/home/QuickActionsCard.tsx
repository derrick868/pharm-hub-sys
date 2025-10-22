import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Package } from 'lucide-react';

export const QuickActionsCard = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
        <CardDescription>Access frequently used features</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        <Button 
          size="lg" 
          className="h-24 flex flex-col gap-2"
          onClick={() => navigate('/pos')}
        >
          <ShoppingCart className="h-8 w-8" />
          <span>Start New Sale</span>
        </Button>
        <Button 
          size="lg" 
          variant="outline" 
          className="h-24 flex flex-col gap-2"
          onClick={() => navigate('/inventory')}
        >
          <Package className="h-8 w-8" />
          <span>View Inventory</span>
        </Button>
      </CardContent>
    </Card>
  );
};
