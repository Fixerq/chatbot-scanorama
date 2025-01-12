import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { NameFields } from './NameFields';

interface RegistrationFormProps {
  supabase: SupabaseClient;
  firstName: string;
  lastName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
}

export const RegistrationForm = ({ 
  supabase, 
  firstName, 
  lastName, 
  setFirstName, 
  setLastName 
}: RegistrationFormProps) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_UP') {
        console.log('User signed up:', session?.user.id);
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName
            })
            .eq('id', session?.user.id);

          if (updateError) throw updateError;
          toast.success('Registration successful!');
        } catch (error) {
          console.error('Error updating profile:', error);
          toast.error('Failed to update profile information');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, firstName, lastName]);

  return (
    <div className="space-y-6">
      <NameFields
        firstName={firstName}
        lastName={lastName}
        setFirstName={setFirstName}
        setLastName={setLastName}
      />
      <div className="rounded-lg">
        <Auth
          supabaseClient={supabase}
          view="sign_up"
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
          }}
          providers={[]}
          redirectTo={`${window.location.origin}/dashboard`}
        />
      </div>
    </div>
  );
};