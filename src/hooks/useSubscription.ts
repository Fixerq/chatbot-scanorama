import { useState, useEffect } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export const useSubscription = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const session = useSession();
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Checking subscription status...');
        const { data, error } = await supabase.functions.invoke('check-subscription', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        
        if (error) {
          console.error('Subscription check error:', error);
          throw error;
        }
        
        console.log('Subscription status:', data);
        setHasSubscription(data.hasSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
        toast.error("Failed to check subscription status.");
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [session, supabase.functions]);

  const handleSubscribe = async (priceId: string) => {
    if (hasSubscription) {
      toast.error("You already have an active subscription. Please manage your subscription in your account settings.");
      return;
    }

    setIsLoading(true);
    
    try {
      if (session) {
        const { data, error } = await supabase.functions.invoke('create-checkout', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: { 
            priceId,
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
        }
      } else {
        const planName = getPlanName(priceId);
        const params = new URLSearchParams({
          priceId,
          planName,
        });
        navigate(`/register-and-order?${params.toString()}`);
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