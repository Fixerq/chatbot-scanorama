import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  useEffect(() => {
    // Get the hash from the URL
    const hashFragment = window.location.hash;
    if (hashFragment) {
      setHash(hashFragment);
    }

    // Handle auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        toast.success("Please enter your new password");
      } else if (event === 'SIGNED_IN') {
        toast.success("Password updated successfully!");
        navigate('/dashboard');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in bg-gradient-to-br from-[#0a192f] via-[#0d1f3a] to-[#0a192f]">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Reset Password
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              Enter your new password below
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
                view="update_password"
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
                    update_password: {
                      password_label: 'New Password',
                      password_input_placeholder: 'Your new password',
                      button_label: 'Update Password',
                      loading_button_label: 'Updating Password ...',
                    },
                  },
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;