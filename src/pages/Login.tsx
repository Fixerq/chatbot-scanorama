
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';
import { LogIn, ArrowRight } from 'lucide-react';

const Login = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!adminError && adminData) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted.current) {
          const isAdmin = await checkAdminStatus(session.user.id);
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted.current) {
          setError('Error checking session status');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();
    
    return () => {
      mounted.current = false;
    };
  }, [navigate]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const isAdmin = await checkAdminStatus(session.user.id);
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
          toast.success('Successfully signed in!');
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted.current) {
            setError('Error processing your authentication. Please try again.');
          }
        }
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        navigate('/reset-password');
      }

      if (event === 'SIGNED_OUT' && mounted.current) {
        setError('');
      }
    });

    return () => {
      mounted.current = false;
      subscription.unsubscribe();
    };
  }, [session, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center">
              <LogIn className="w-12 h-12 text-[#0FA0CE]" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-[#0FA0CE] to-[#0D8CAD] bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Sign in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
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
                        brand: '#0FA0CE',
                        brandAccent: '#0D8CAD',
                        brandButtonText: 'white',
                        defaultButtonBackground: 'rgb(15 23 42)',
                        defaultButtonBackgroundHover: 'rgb(30 41 59)',
                        inputBackground: 'rgb(15 23 42)',
                        inputBorder: 'rgb(51 65 85)',
                        inputBorderHover: 'rgb(71 85 105)',
                        inputBorderFocus: '#0FA0CE',
                        inputText: 'white',
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-[#0FA0CE]/20',
                    input: 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0FA0CE] focus:border-transparent transition-all duration-200',
                    label: 'block text-sm font-medium text-muted-foreground mb-1.5',
                    message: 'text-sm text-red-500 mt-1',
                    anchor: 'text-[#0FA0CE] hover:text-[#0D8CAD] transition-colors',
                  },
                }}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email address',
                      password_label: 'Password',
                      email_input_placeholder: 'Your email address',
                      password_input_placeholder: 'Your password',
                      button_label: 'Sign in',
                      loading_button_label: 'Signing in ...',
                      social_provider_text: 'Sign in with {{provider}}',
                    },
                  },
                }}
                providers={[]}
                view="sign_in"
                redirectTo={`${window.location.origin}/dashboard`}
              />
            </div>
            <div className="pt-4 text-center space-y-4">
              <div className="text-sm text-muted-foreground">
                Don't have an account yet?
              </div>
              <Link to="/sales">
                <Button 
                  variant="outline" 
                  className="w-full group hover:bg-[#0FA0CE] hover:text-white transition-all duration-200"
                >
                  View Plans & Sign Up
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
