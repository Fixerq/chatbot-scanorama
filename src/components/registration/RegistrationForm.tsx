import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
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
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error initializing session:', sessionError);
          toast.error('Failed to initialize session. Please try again.');
          return;
        }

        if (session) {
          console.log('Session initialized successfully:', session.user.id);
        } else {
          console.log('No active session found');
        }
      } catch (error) {
        console.error('Error in session initialization:', error);
        toast.error('Session initialization failed');
      }
    };

    initializeSession();
  }, [supabase.auth]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if ((event === 'SIGNED_IN' || event === 'USER_UPDATED') && session?.user?.id) {
        setIsProcessing(true);
        console.log('User signed up/in, updating profile with names:', firstName, lastName);
        
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

          // Create or update customer record
          const { error: customerError } = await supabase
            .from('customers')
            .upsert({
              user_id: session.user.id,
              email: session.user.email,
              first_name: firstName,
              last_name: lastName,
              price_id: priceId
            });

          if (customerError) {
            console.error('Customer update error:', customerError);
            throw customerError;
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

          // Send welcome email with proper error handling and debugging
          console.log('Attempting to send welcome email to:', session.user.email);
          const { error: emailError, data: emailData } = await supabase.functions.invoke('send-welcome-email', {
            body: {
              email: session.user.email,
              firstName: firstName,
              lastName: lastName
            },
            headers: {
              'x-application-name': 'Engage AI Pro',
              'Content-Type': 'application/json'
            }
          });

          if (emailError) {
            console.error('Error sending welcome email:', emailError);
            toast.error('Failed to send welcome email. Please contact support.');
            throw emailError;
          }

          console.log('Welcome email response:', emailData);
          toast.success('Registration successful! Please check your email to continue.');
          
          console.log('Profile and subscription updated successfully');

          // Sign out the user and redirect to login
          await supabase.auth.signOut();
          window.location.href = '/login';
        } catch (error) {
          console.error('Error in registration process:', error);
          toast.error('Failed to complete registration. Please try again.');
        } finally {
          setIsProcessing(false);
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
        {isProcessing ? (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
            <span className="ml-2 text-sm text-muted-foreground">Processing registration...</span>
          </div>
        ) : (
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
        )}
      </div>
    </div>
  );
};