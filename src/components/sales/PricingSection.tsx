import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from "sonner";
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
  },
  {
    name: "Founders Plan",
    price: "$497",
    priceId: "price_1QeakhEiWhAkWDnrFounders",
    special: true,
    description: "Exclusive lifetime access with unlimited features for early supporters.",
    features: [
      "Unlimited Website Searches",
      "Advanced Analytics Dashboard",
      "Priority Support",
      "Early Access to Features",
      "Lifetime Updates",
      "Custom Integration Support"
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
        console.log('Checking subscription status...');
        const { data, error } = await supabase.functions.invoke('check-subscription');
        
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

    try {
      setIsLoading(true);
      console.log('Creating checkout session for price:', priceId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId }
      });

      if (error) throw error;
      
      if (data?.url) {
        console.log('Redirecting to checkout:', data.url);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout process. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background gradient with animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/80 to-background animate-gradient opacity-80" />
      
      {/* Glowing orbs for visual interest */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-200" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 animate-fade-in">
          <h2 className="text-4xl font-bold text-foreground sm:text-5xl glow-text">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 animate-fade-in delay-100">
          {plans.map((plan, index) => (
            <div key={plan.name} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <PricingCard
                {...plan}
                onSubscribe={handleSubscribe}
                isLoading={isLoading}
                hasSubscription={hasSubscription}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
