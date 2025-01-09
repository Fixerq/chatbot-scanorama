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

    try {
      setIsSubscriptionLoading(true);
      console.log('Checking subscription status...');
      
      // Pass the authorization header with the session access token
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      if (subscriptionError) {
        console.error('Subscription check error:', subscriptionError);
        throw new Error('Failed to check subscription status');
      }

      console.log('Subscription status:', subscriptionData);

      if (subscriptionData?.hasSubscription) {
        // Create portal session for existing subscribers
        console.log('Creating portal session...');
        const { data: portalData, error: portalError } = await supabase.functions.invoke('create-portal-session', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: { userId: session.user.id }
        });
        
        if (portalError) {
          console.error('Portal session error:', portalError);
          throw new Error('Failed to create portal session');
        }
        
        if (!portalData?.url) {
          throw new Error('No portal URL received');
        }

        console.log('Redirecting to portal:', portalData.url);
        window.location.href = portalData.url;
      } else {
        // Create checkout session for new subscribers
        console.log('Creating checkout session...');
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          },
          body: { 
            priceId: 'price_1QeakhEiWhAkWDnr2yad4geJ',
            userId: session.user.id 
          }
        });
        
        if (checkoutError) {
          console.error('Checkout session error:', checkoutError);
          throw new Error('Failed to create checkout session');
        }
        
        if (!checkoutData?.url) {
          throw new Error('No checkout URL received');
        }

        console.log('Redirecting to checkout:', checkoutData.url);
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Subscription management error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to manage subscription. Please try again.");
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