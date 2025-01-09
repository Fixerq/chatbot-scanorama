export type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  priceId: string;
  popular?: boolean;
  special?: boolean;
};

export type PricingPlansData = {
  starter: PricingPlan;
  pro: PricingPlan;
  founders: PricingPlan;
};