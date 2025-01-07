import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    const getCustomerEmail = async () => {
      if (!sessionId) return;

      try {
        const { data, error } = await supabase.functions.invoke('get-customer-email', {
          body: { sessionId }
        });

        if (error) throw error;
        if (data?.email) {
          setCustomerEmail(data.email);
        }
      } catch (error) {
        console.error('Error fetching customer email:', error);
        toast.error('Failed to fetch customer information');
      }
    };

    getCustomerEmail();
  }, [sessionId, supabase.functions]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Complete Your Registration
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              {customerEmail ? `Welcome ${customerEmail}! Please set your password to complete signup.` : 'Please create your account to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg p-4">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: 'rgb(6 182 212)',
                        brandAccent: 'rgb(8 145 178)',
                        brandButtonText: 'white',
                      },
                    },
                  },
                }}
                view="sign_up"
                providers={[]}
                redirectTo={`${window.location.origin}/dashboard`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;