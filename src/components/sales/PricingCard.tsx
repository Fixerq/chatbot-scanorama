import React from 'react';
import { Button } from "@/components/ui/button";
import PricingFeature from './PricingFeature';

interface PricingCardProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
  priceId: string;
  onSubscribe: (priceId: string) => void;
}

const PricingCard = ({
  name,
  price,
  description,
  features,
  popular,
  priceId,
  onSubscribe
}: PricingCardProps) => {
  return (
    <div
      className={`relative rounded-2xl border p-8 shadow-lg ${
        popular ? 'border-cyan-500 ring-2 ring-cyan-500' : 'border-gray-200'
      }`}
    >
      {popular && (
        <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1 text-sm font-semibold text-white">
          Most Popular
        </span>
      )}

      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
        <p className="mt-2 text-sm text-gray-600">{description}</p>
        <p className="mt-4">
          <span className="text-4xl font-bold text-gray-900">{price}</span>
          <span className="text-gray-600">/month</span>
        </p>
      </div>

      <ul className="mt-8 space-y-4">
        {features.map((feature) => (
          <PricingFeature key={feature} feature={feature} />
        ))}
      </ul>

      <Button
        onClick={() => onSubscribe(priceId)}
        className={`mt-8 w-full ${
          popular
            ? 'bg-cyan-500 hover:bg-cyan-600'
            : 'bg-gray-800 hover:bg-gray-900'
        }`}
      >
        Get Started
      </Button>
    </div>
  );
};

export default PricingCard;