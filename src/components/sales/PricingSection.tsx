import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from "@/hooks/use-toast";
import PricingCard from './PricingCard';

const plans = [
  {
    name: "Starter Plan",
    price: "$97",
    priceId: "price_1QeakhEiWhAkWDnrevEe12PJ",
    description: "Perfect for small businesses and solo entrepreneurs looking to get started with chatbot prospecting.",
    features: [
      "500 Website Searches",
      "Local Business Discovery",
      "Basic Analytics",
      "CSV Uploads",
      "Email Support"
    ]
  },
  {
    name: "Pro Plan",
    price: "$197",
    priceId: "price_1QeakhEiWhAkWDnr2yad4geJ",
    popular: true,
    description: "Designed for growing teams and mid-sized businesses looking to scale their customer outreach.",
    features: [
      "2000 Website Searches",
      "Advanced Website Analytics",
      "Multi-Region Discovery",
      "Priority Email Support",
      "Customizable Exports"
    ]
  },
  {
    name: "Premium Plan",
    price: "$297",
    priceId: "price_1QeakhEiWhAkWDnrnZgRSuyR",
    description: "The ultimate plan for enterprises and agencies with high-volume prospecting needs.",
    features: [
      "5000 Website Searches",
      "Comprehensive Analytics",
      "Global Business Discovery",
      "CSV Automation",
      "Dedicated Account Manager"
    ]
  }
];

const PricingSection = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [hasSubscription, setHasSubscription] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkSubscription = async () => {
      if (!session?.access_token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
        if (error) throw error;
        setHasSubscription(data.hasSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
        toast({
          title: "Error",
          description: "Failed to check subscription status.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, [session, supabase.functions]);

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
        variant: "destructive"
      });
      navigate('/login');
      return;
    }

    if (hasSubscription) {
      toast({
        title: "Active Subscription",
        description: "You already have an active subscription. Please manage your subscription in your account settings.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.name}
              {...plan}
              onSubscribe={handleSubscribe}
              isLoading={isLoading}
              hasSubscription={hasSubscription}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;