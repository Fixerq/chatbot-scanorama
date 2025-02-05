import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from 'sonner';
import { Alert, AlertDescription } from "@/components/ui/alert";

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
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

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      console.log('Auth event:', event);
      
      if (event === 'USER_UPDATED') {
        toast.success('Successfully signed up!');
        navigate('/dashboard');
      } else if (event === 'SIGNED_IN') {
        toast.success('Account created successfully!');
        navigate('/dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, supabase.auth]);

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
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
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
                        defaultButtonBackground: 'rgb(15 23 42)',
                        defaultButtonBackgroundHover: 'rgb(30 41 59)',
                        inputBackground: 'rgb(15 23 42)',
                        inputBorder: 'rgb(51 65 85)',
                        inputBorderHover: 'rgb(71 85 105)',
                        inputBorderFocus: 'rgb(6 182 212)',
                        inputText: 'white', // Changed from default dark color to white
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 glow-border',
                    input: 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200 text-white', // Added text-white class
                    label: 'block text-sm font-medium text-muted-foreground mb-1.5',
                    message: 'text-sm text-red-500 mt-1',
                    anchor: 'text-cyan-400 hover:text-cyan-300', // Added styling for links
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