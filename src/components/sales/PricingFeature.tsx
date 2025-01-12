import React from 'react';
import { Check } from "lucide-react";

interface PricingFeatureProps {
  text: string;
}

const PricingFeature = ({ text }: PricingFeatureProps) => {
  return (
    <li className="flex items-start">
      <Check className="h-5 w-5 text-cyan-500 shrink-0" />
      <span className="ml-3 text-gray-600">{text}</span>
    </li>
  );
};

export default PricingFeature;