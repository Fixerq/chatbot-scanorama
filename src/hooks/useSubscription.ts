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
    console.log('Starting subscription process:', { priceId, productId });
    
    if (hasSubscription) {
      console.log('Subscription already exists');
      toast.error("You already have an active subscription");
      return;
    }

    setIsLoading(true);
    
    try {
      if (!session?.user?.id) {
        console.log('No session, creating guest checkout');
        const { data, error } = await supabase.functions.invoke('create-guest-checkout', {
          body: { 
            priceId,
            successUrl: `${window.location.origin}/register-and-order?priceId=${priceId}&planName=Founders%20Plan`,
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
          console.error('No checkout URL received:', data);
          throw new Error('Unable to create checkout session');
        }
      } else {
        // User is logged in, proceed with normal checkout
        console.log('Creating checkout session for logged in user');
        const { data, error } = await supabase.functions.invoke('create-checkout', {
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
          console.error('No checkout URL received:', data);
          throw new Error('Unable to create checkout session');
        }
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast.error('Failed to process subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleSubscribe,
    isLoading,
    hasSubscription
  };
};