import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import PricingCard from './PricingCard';
import { toast } from 'sonner';

const PricingSection = () => {
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
        // If user is logged in, proceed with checkout
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
        // If user is not logged in, redirect to registration page with product info
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

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl lg:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Choose the plan that's right for you
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
          <PricingCard
            name="Starter"
            price="$9"
            description="Perfect for trying out our service"
            features={[
              "5 searches per month",
              "Basic chat detection",
              "Email support"
            ]}
            priceId="price_1QfP4KEiWhAkWDnrNXFYWR9L"
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            name="Pro"
            price="$297"
            description="For businesses that need more"
            features={[
              "5000 searches per month",
              "Advanced chat detection",
              "Priority support",
              "Custom integrations"
            ]}
            popular
            priceId="price_1QfP3LEiWhAkWDnrTYVVFBk9"
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            name="Founders"
            price="$97"
            description="Limited time offer"
            features={[
              "Lifetime access",
              "All Pro features",
              "Early access to new features",
              "Direct support line",
              "Custom development hours"
            ]}
            special
            priceId="price_1QfP20EiWhAkWDnrDhllA5a1"
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
        </div>
      </div>
    </section>
  );
};

export default PricingSection;