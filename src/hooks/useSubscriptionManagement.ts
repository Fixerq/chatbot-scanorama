
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
        console.log('Fetching subscription for user:', session.user.id);
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions_with_user')
          .select('level, stripe_customer_id, status')
          .single();

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          return;
        }

        console.log('Subscription data:', subscriptionData);
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
      // Get the current subscription status
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions_with_user')
        .select('stripe_customer_id, stripe_subscription_id, level, status')
        .single();

      if (subError) {
        console.error('Error fetching subscription:', subError);
        throw subError;
      }

      console.log('Current subscription:', subscription);

      // Special handling for Founders plan
      if (subscription?.level === 'founders') {
        toast.info('Founders plan members have lifetime access');
        setIsSubscriptionLoading(false);
        return;
      }

      // If user has a Stripe customer ID, create a portal session
      if (subscription?.stripe_customer_id) {
        console.log('Creating portal session for customer:', subscription.stripe_customer_id);
        const { data: portalData, error: portalError } = await supabase.functions.invoke('create-portal-session', {
          body: { customerId: subscription.stripe_customer_id },
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (portalError) {
          console.error('Portal session error:', portalError);
          throw new Error('Failed to access subscription portal');
        }

        if (!portalData?.url) {
          console.error('No portal URL received:', portalData);
          throw new Error('Unable to access subscription portal');
        }

        console.log('Redirecting to portal URL:', portalData.url);
        window.location.href = portalData.url;
      } else {
        // If no Stripe customer ID, create a new checkout session
        const baseUrl = window.location.origin;
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
          throw new Error('Failed to create checkout session');
        }
        
        if (!checkoutData?.url) {
          console.error('No checkout URL received:', checkoutData);
          throw new Error('Unable to create checkout session');
        }

        console.log('Redirecting to checkout URL:', checkoutData.url);
        window.location.href = checkoutData.url;
      }
    } catch (error) {
      console.error('Subscription management error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to manage subscription');
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
