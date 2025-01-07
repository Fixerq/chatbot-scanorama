import React from 'react';
import { Button } from "@/components/ui/button";
import PricingFeature from './PricingFeature';
import { Loader2 } from 'lucide-react';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  priceId: string;
  onSubscribe: (priceId: string) => void;
  isLoading?: boolean;
  hasSubscription?: boolean;
}

const PricingCard = ({
  name,
  price,
  description,
  features,
  popular,
  priceId,
  onSubscribe,
  isLoading = false,
  hasSubscription = false
}: PricingCardProps) => {
  return (
    <div
      className={`relative rounded-2xl border bg-card p-8 shadow-lg ${
        popular ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-gray-700'
      }`}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1 text-sm font-semibold text-black">
          Most Popular
        </span>
      )}

      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">{name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p className="mt-4">
          <span className="text-4xl font-bold text-foreground">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </p>
      </div>

      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <PricingFeature key={feature} feature={feature} />
        ))}
      </ul>

      <Button
        onClick={() => onSubscribe(priceId)}
        disabled={isLoading || hasSubscription}
        className={`mt-8 w-full ${
          popular
            ? 'bg-cyan-500 hover:bg-cyan-600 text-black'
            : 'bg-secondary hover:bg-secondary/80 text-foreground'
        }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : hasSubscription ? (
          'Already Subscribed'
        ) : (
          'Get Started'
        )}
      </Button>
    </div>
  );
};

export default PricingCard;