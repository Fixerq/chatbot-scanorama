import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient, AuthError, AuthChangeEvent } from '@supabase/supabase-js';
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user?.id) {
        console.log('User signed up, waiting for profile creation...');
        
        let retryCount = 0;
        const maxRetries = 7; // Increased retries
        const retryDelay = 3000; // 3 seconds between retries
        
        const updateProfile = async () => {
          try {
            // First check if profile exists
            const { data: profile, error: fetchError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (fetchError) {
              console.error('Error fetching profile:', fetchError);
              throw fetchError;
            }
            
            if (!profile) {
              if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Profile not found, retry attempt ${retryCount}/${maxRetries} in ${retryDelay}ms`);
                setTimeout(updateProfile, retryDelay);
                return;
              }
              throw new Error('Profile creation failed after retries');
            }

            console.log('Profile found, updating with names:', { firstName, lastName });

            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                first_name: firstName,
                last_name: lastName
              })
              .eq('id', session.user.id);

            if (updateError) throw updateError;
            
            console.log('Profile updated successfully');
            toast.success('Registration successful!');
          } catch (error) {
            const authError = error as AuthError;
            console.error('Error updating profile:', authError);
            
            if (retryCount < maxRetries) {
              retryCount++;
              console.log(`Error occurred, retrying (${retryCount}/${maxRetries})...`);
              setTimeout(updateProfile, retryDelay);
              return;
            }
            
            if (authError.message?.includes('timeout') || authError.message?.includes('Failed to fetch')) {
              toast.error('Connection timeout. Please try again or check your internet connection.');
            } else {
              toast.error('Failed to update profile information. Please try again.');
            }
          }
        };

        await updateProfile();
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
          redirectTo={window.location.origin + '/dashboard'}
        />
      </div>
    </div>
  );
};