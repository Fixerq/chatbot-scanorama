import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from "@/hooks/use-toast";

const plans = [
  {
    name: "Basic",
    price: "$9",
    priceId: "price_1QeakhEiWhAkWDnrevEe12PJ",
    features: [
      "Basic lead generation",
      "10 searches per month",
      "Email support",
      "Basic analytics"
    ]
  },
  {
    name: "Professional",
    price: "$29",
    priceId: "price_1QeakhEiWhAkWDnr2yad4geJ",
    popular: true,
    features: [
      "Advanced lead generation",
      "100 searches per month",
      "Priority email support",
      "Advanced analytics",
      "Custom exports",
      "Team collaboration"
    ]
  },
  {
    name: "Enterprise",
    price: "$99",
    priceId: "price_1QeakhEiWhAkWDnrnZgRSuyR",
    features: [
      "Enterprise-grade lead generation",
      "Unlimited searches",
      "24/7 phone support",
      "Custom analytics",
      "API access",
      "Dedicated account manager",
      "Custom integrations",
      "SLA guarantee"
    ]
  }
];

const PricingSection = () => {
  const session = useSession();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();

  const handleSubscribe = async (priceId: string) => {
    if (!session) {
      navigate('/login');
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
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 shadow-lg ${
                plan.popular ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1 text-sm font-semibold text-white">
                  Most Popular
                </span>
              )}

              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <p className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">/month</span>
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <Check className="h-5 w-5 text-cyan-500 shrink-0" />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSubscribe(plan.priceId)}
                className={`mt-8 w-full ${
                  plan.popular
                    ? 'bg-cyan-500 hover:bg-cyan-600'
                    : 'bg-gray-800 hover:bg-gray-900'
                }`}
              >
                Get Started
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;