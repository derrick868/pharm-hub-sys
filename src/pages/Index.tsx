import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import amikoLogo from '@/assets/amiko.png';




const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        navigate('/dashboard'); // Always go to dashboard if logged in
      }

      setChecking(false);
    };

    checkSession();
  }, [navigate]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
      <div className="text-center space-y-6 p-8">
        {/* Logo Section */}
        <div className="flex justify-center mb-8">
          <div className="p-6 bg-primary/20 rounded-full">
            <img
              src={amikoLogo}
              alt="HEKODA MEDICURE CLINIC logo"
              className="h-16 w-16 object-contain rounded-full"
            />
          </div>
        </div>

        {/* Clinic Name and Description */}
        <h1 className="text-5xl font-bold mb-4">HEKODA MEDICURE CLINIC</h1>
        <p className="text-xl text-muted-foreground max-w-md mx-auto">
          Providing quality healthcare and pharmaceutical services with compassion and efficiency.
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
