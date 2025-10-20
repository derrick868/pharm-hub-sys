import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Pill } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-6 p-8">
        <div className="flex justify-center mb-8">
          <div className="p-6 bg-primary/20 rounded-full">
            <Pill className="h-16 w-16 text-primary" />
          </div>
        </div>
        <h1 className="text-5xl font-bold mb-4">Pharmacy Management System</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Streamline your pharmacy operations with our comprehensive management solution
        </p>
        <div className="pt-6">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
