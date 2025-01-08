import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSubscriptionManagement = () => {
  const supabase = useSupabaseClient();
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

  const handleSubscriptionAction = async () => {
    try {
      setIsSubscriptionLoading(true);
      console.log('Checking subscription status...');
      
      const { data: subscriptionData, error: subscriptionError } = await supabase.functions.invoke('check-subscription');
      
      if (subscriptionError) throw subscriptionError;

      if (subscriptionData.hasSubscription) {
        // Create portal session for existing subscribers
        console.log('Creating portal session...');
        const { data: portalData, error: portalError } = await supabase.functions.invoke('create-portal-session');
        
        if (portalError) throw portalError;
        
        if (portalData?.url) {
          console.log('Redirecting to portal:', portalData.url);
          window.location.href = portalData.url;
        }
      } else {
        // Create checkout session for new subscribers
        console.log('Creating checkout session...');
        const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
          body: { priceId: 'price_1QeakhEiWhAkWDnr2yad4geJ' } // Pro plan price ID
        });
        
        if (checkoutError) throw checkoutError;
        
        if (checkoutData?.url) {
          console.log('Redirecting to checkout:', checkoutData.url);
          window.location.href = checkoutData.url;
        }
      }
    } catch (error) {
      console.error('Subscription management error:', error);
      toast.error("Failed to manage subscription. Please try again.");
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  return {
    handleSubscriptionAction,
    isSubscriptionLoading,
  };
};