import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from 'sonner';

const Login = () => {
  const session = useSession();
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .single();

      if (!adminError && adminData) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  useEffect(() => {
    const handleSession = async () => {
      if (session) {
        try {
          const isAdmin = await checkAdminStatus(session.user.id);
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        } catch (error) {
          console.error('Session handling error:', error);
          setError('Error processing your session. Please try again.');
        }
      }
    };

    handleSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
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
          setError('Error processing your authentication. Please try again.');
        }
      }
      
      if (event === 'PASSWORD_RECOVERY') {
        toast.info('Please check your email for password reset instructions.');
      }

      if (event === 'SIGNED_OUT') {
        setError('');
        toast.success('Successfully signed out!');
      }

      // Handle specific auth errors
      if (event === 'USER_DELETED') {
        setError('User account has been deleted.');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Sign in to access your dashboard
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
                        inputText: 'white',
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 glow-border',
                    input: 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200',
                    label: 'block text-sm font-medium text-muted-foreground mb-1.5',
                    message: 'text-sm text-red-500 mt-1',
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
                      link_text: "Already have an account? Sign in",
                    },
                    sign_up: {
                      email_label: 'Email address',
                      password_label: 'Create a Password',
                      email_input_placeholder: 'Your email address',
                      password_input_placeholder: 'Your password',
                      button_label: 'Sign up',
                      loading_button_label: 'Signing up ...',
                      social_provider_text: 'Sign up with {{provider}}',
                      link_text: "Don't have an account? Sign up",
                    },
                    forgotten_password: {
                      email_label: 'Email address',
                      password_label: 'Password',
                      email_input_placeholder: 'Your email address',
                      button_label: 'Send reset instructions',
                      loading_button_label: 'Sending reset instructions ...',
                      link_text: 'Forgot your password?',
                    },
                  },
                }}
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

export default Login;