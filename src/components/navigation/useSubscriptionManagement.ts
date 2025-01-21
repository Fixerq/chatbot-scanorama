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
          .select('level, stripe_customer_id')
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
      // Get the current subscription status
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('user_id', session.user.id)
        .single();

      // If user has a Stripe customer ID, create a portal session
      if (subscription?.stripe_customer_id) {
        console.log('Creating portal session for existing customer');
        const { data: portalData, error: portalError } = await supabase.functions.invoke('create-portal-session', {
          body: {},
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (portalError) {
          console.error('Portal session error:', portalError);
          toast.error('Failed to access subscription portal. Please try again.');
          return;
        }

        if (!portalData?.url) {
          console.error('No portal URL received:', portalData);
          toast.error('Unable to access subscription portal');
          return;
        }

        console.log('Redirecting to portal URL:', portalData.url);
        window.location.href = portalData.url;
      } else {
        // If no Stripe customer ID, create a new checkout session
        const baseUrl = window.location.origin.replace(/[:/]+$/, '');
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
      }
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