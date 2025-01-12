import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { RegistrationHeader } from '@/components/registration/RegistrationHeader';
import { RegistrationForm } from '@/components/registration/RegistrationForm';

const RegisterAndOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const priceId = searchParams.get('priceId');
  const planName = searchParams.get('planName');

  useEffect(() => {
    if (session?.user) {
      console.log('User is authenticated:', session.user);
      if (priceId) {
        handleCheckout();
      } else {
        navigate('/dashboard');
      }
    }
  }, [session]);

  const handleCheckout = async () => {
    if (!session?.access_token) {
      console.error('No access token available');
      return;
    }

    setLoading(true);
    try {
      const returnUrl = `${window.location.origin}/success`;
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { 
          priceId,
          returnUrl,
          customerName: `${firstName} ${lastName}`.trim()
        }
      });

      if (error) throw error;
      
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to checkout:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to process subscription. Please try again.');
      setLoading(false);
    }
  };

  if (!priceId || !planName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-md border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <CardContent className="space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Invalid Request
            </h2>
            <p className="text-lg text-muted-foreground">
              Missing required product information. Please select a plan from our pricing page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl">
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <RegistrationHeader planName={planName} />
          <CardContent className="space-y-6 px-6 pb-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <RegistrationForm
              supabase={supabase}
              firstName={firstName}
              lastName={lastName}
              setFirstName={setFirstName}
              setLastName={setLastName}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAndOrder;