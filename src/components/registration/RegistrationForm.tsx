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
  priceId?: string;
  customerEmail?: string | null;
}

export const RegistrationForm = ({ 
  supabase, 
  firstName, 
  lastName, 
  setFirstName, 
  setLastName,
  priceId,
  customerEmail 
}: RegistrationFormProps) => {
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        console.log('User signed up, updating profile with names:', firstName, lastName);
        
        try {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              first_name: firstName,
              last_name: lastName
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('Profile update error:', updateError);
            throw updateError;
          }
          
          console.log('Profile updated successfully');
          toast.success('Registration successful!');
          
        } catch (error) {
          console.error('Error in registration process:', error);
          toast.error('Failed to complete registration. Please try again.');
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, firstName, lastName, priceId]);

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
          redirectTo={window.location.origin}
          data={{
            email: customerEmail || undefined
          }}
        />
      </div>
    </div>
  );
};