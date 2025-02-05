import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { NameFields } from './NameFields';
import { Database } from '@/integrations/supabase/types';

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
          // Update profile with names
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
          
          // If priceId is provided, update subscription level
          if (priceId) {
            console.log('Updating subscription for price:', priceId);
            let subscriptionLevel: Database['public']['Enums']['subscription_level'] = 'starter';
            let totalSearches = 25; // Default starter plan searches

            // Set subscription level based on priceId
            if (priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1') {
              subscriptionLevel = 'founders';
              totalSearches = -1; // Unlimited searches
            } else if (priceId === 'price_1QeakhEiWhAkWDnrnZgRSuyR') {
              subscriptionLevel = 'pro';
              totalSearches = 5000;
            } else if (priceId === 'price_1QeakhEiWhAkWDnrevEe12PJ') {
              subscriptionLevel = 'starter';
              totalSearches = 500;
            }

            const { error: subscriptionError } = await supabase
              .from('subscriptions')
              .update({
                level: subscriptionLevel,
                status: 'active',
                total_searches: totalSearches
              })
              .eq('user_id', session.user.id);

            if (subscriptionError) {
              console.error('Subscription update error:', subscriptionError);
              throw subscriptionError;
            }
          }
          
          console.log('Profile and subscription updated successfully');
          toast.success('Registration successful!');

          // Redirect to dashboard
          window.location.href = '/dashboard';
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
        />
      </div>
    </div>
  );
};