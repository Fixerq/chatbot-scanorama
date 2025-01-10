import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AuthError } from '@supabase/supabase-js';

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
        const isAdmin = await checkAdminStatus(session.user.id);
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    };

    handleSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const isAdmin = await checkAdminStatus(session.user.id);
        if (isAdmin) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
      
      // Clear errors on sign out
      if (event === 'SIGNED_OUT') {
        setError('');
      }

      // Handle auth errors through the event listener
      if (event === 'USER_DELETED' as any) {
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
                        brand: 'rgb(6 182 212)', // cyan-500
                        brandAccent: 'rgb(8 145 178)', // cyan-600
                        brandButtonText: 'white',
                        defaultButtonBackground: 'rgb(15 23 42)', // slate-900
                        defaultButtonBackgroundHover: 'rgb(30 41 59)', // slate-800
                        inputBackground: 'rgb(15 23 42)', // slate-900
                        inputBorder: 'rgb(51 65 85)', // slate-700
                        inputBorderHover: 'rgb(71 85 105)', // slate-600
                        inputBorderFocus: 'rgb(6 182 212)', // cyan-500
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 glow-border',
                    input: 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200',
                    label: 'block text-sm font-medium text-muted-foreground mb-1.5',
                    loader: 'text-cyan-500',
                    message: 'text-sm text-red-500 mt-1',
                  },
                }}
                theme="dark"
                providers={[]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;