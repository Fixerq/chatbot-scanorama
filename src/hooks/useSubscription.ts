import { useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const handleSubscribe = async (priceId: string, productId: string) => {
    console.log('Starting subscription process:', { priceId, productId, hasSubscription, session: !!session });
    
    if (hasSubscription) {
      console.log('Subscription already exists');
      toast.error("You already have an active subscription");
      return;
    }

    setIsLoading(true);
    
    try {
      if (session) {
        // If user is logged in, proceed with normal checkout
        console.log('Creating checkout session for logged in user');
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: { 
            priceId,
            productId,
            returnUrl: window.location.origin
          }
        });

        if (error) {
          console.error('Checkout error:', error);
          throw error;
        }
        
        if (data?.url) {
          console.log('Redirecting to checkout:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No checkout URL received');
          throw new Error('No checkout URL received');
        }
      } else {
        // If user is not logged in, create a guest checkout session
        console.log('Creating guest checkout session');
        const { data, error } = await supabase.functions.invoke('create-guest-checkout', {
          body: { 
            priceId,
            productId,
            successUrl: `${window.location.origin}/register-and-order?priceId=${priceId}&planName=${getPlanName(priceId)}`,
            cancelUrl: window.location.origin
          }
        });

        if (error) {
          console.error('Guest checkout error:', error);
          throw error;
        }
        
        if (data?.url) {
          console.log('Redirecting to guest checkout:', data.url);
          window.location.href = data.url;
        } else {
          console.error('No guest checkout URL received');
          throw new Error('No guest checkout URL received');
        }
      }
    } catch (error) {
      console.error('Error in subscription process:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanName = (priceId: string): string => {
    switch (priceId) {
      case 'price_1QfP20EiWhAkWDnrDhllA5a1':
        return 'Founders Plan';
      case 'price_1QfP3LEiWhAkWDnrTYVVFBk9':
        return 'Pro Plan';
      case 'price_1QfP4KEiWhAkWDnrNXFYWR9L':
        return 'Starter Plan';
      default:
        return 'Selected Plan';
    }
  };

  return {
    isLoading,
    hasSubscription,
    handleSubscribe
  };
};