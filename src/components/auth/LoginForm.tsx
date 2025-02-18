
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoginFormProps } from '@/types/auth';
import { useState, useEffect } from 'react';

export const LoginForm = ({ error }: LoginFormProps) => {
  const [localError, setLocalError] = useState<string>('');

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('LoginForm auth state changed:', event);
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        setLocalError('');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <div className="rounded-lg p-4">
      {(error || localError) && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error || localError}</AlertDescription>
        </Alert>
      )}
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
            loader: 'animate-spin text-[#0FA0CE]',
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
        showLinks={false}
        onlyThirdPartyProviders={false}
      />
    </div>
  );
};
