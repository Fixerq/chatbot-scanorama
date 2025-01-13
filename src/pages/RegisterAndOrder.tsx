import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { RegistrationHeader } from '@/components/registration/RegistrationHeader';
import { RegistrationForm } from '@/components/registration/RegistrationForm';

const RegisterAndOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  
  const priceId = searchParams.get('priceId');
  const planName = searchParams.get('planName');
  const sessionId = searchParams.get('session_id');

  console.log('RegisterAndOrder: Initial render with params:', { priceId, planName, sessionId });

  useEffect(() => {
    const getCustomerDetails = async () => {
      if (!sessionId) {
        console.log('No session ID provided, skipping customer details fetch');
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching customer details for session:', sessionId);
        
        const { data, error } = await supabase.functions.invoke('get-customer-details', {
          body: { sessionId }
        });

        if (error) {
          console.error('Error fetching customer details:', error);
          throw error;
        }

        console.log('Customer details received:', data);

        if (data?.customer) {
          const names = data.customer.name?.split(' ') || ['', ''];
          setFirstName(names[0] || '');
          setLastName(names.slice(1).join(' ') || '');
          setCustomerEmail(data.customer.email || null);
          console.log('Customer details set:', { 
            firstName: names[0], 
            lastName: names.slice(1).join(' '), 
            email: data.customer.email 
          });
        }
      } catch (error) {
        console.error('Error in getCustomerDetails:', error);
        toast.error('Failed to fetch customer information');
        setError('Failed to fetch customer information. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    getCustomerDetails();
  }, [sessionId, supabase.functions]);

  if (!priceId || !planName) {
    console.error('Missing required parameters:', { priceId, planName });
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-md border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <CardContent className="space-y-2 text-center p-6">
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
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading customer details...</p>
              </div>
            ) : (
              <RegistrationForm
                supabase={supabase}
                firstName={firstName}
                lastName={lastName}
                setFirstName={setFirstName}
                setLastName={setLastName}
                priceId={priceId}
                customerEmail={customerEmail}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAndOrder;