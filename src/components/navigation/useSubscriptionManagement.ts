import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSubscriptionManagement = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!session?.user?.id) return;
      
      try {
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('level')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          return;
        }

        setCurrentPlan(subscriptionData?.level || 'starter');
      } catch (error) {
        console.error('Error fetching subscription plan:', error);
      }
    };

    fetchCurrentPlan();
  }, [supabase, session]);

  const handleSubscriptionAction = async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to manage your subscription");
      return;
    }

    setIsSubscriptionLoading(true);

    try {
      // Clean up the return URL by removing any trailing slashes or colons
      const baseUrl = window.location.origin.replace(/[:\/]+$/, '');
      console.log('Creating checkout session with return URL:', baseUrl);

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId: 'price_1QfP20EiWhAkWDnrDhllA5a1',
          returnUrl: baseUrl
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (checkoutError) {
        console.error('Checkout session error:', checkoutError);
        toast.error('Failed to create checkout session. Please try again.');
        return;
      }
      
      if (!checkoutData?.url) {
        console.error('No checkout URL received:', checkoutData);
        toast.error('Unable to create checkout session');
        return;
      }

      console.log('Redirecting to checkout URL:', checkoutData.url);
      window.location.href = checkoutData.url;
    } catch (error) {
      console.error('Subscription management error:', error);
      toast.error('Failed to manage subscription. Please try again.');
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  return {
    handleSubscriptionAction,
    isSubscriptionLoading,
    currentPlan
  };
};