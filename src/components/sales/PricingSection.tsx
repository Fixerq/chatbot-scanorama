import { useEffect, useState } from 'react';
import PricingCard from './PricingCard';
import PricingSectionHeader from './PricingSectionHeader';
import { useSubscription } from '@/hooks/useSubscription';
import { pricingPlans } from '@/data/pricingPlans';

const PricingSection = () => {
  const { isLoading, hasSubscription, handleSubscribe } = useSubscription();

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="max-w-7xl mx-auto">
        <PricingSectionHeader />

        <div className="grid gap-8 lg:grid-cols-3 lg:gap-12 max-w-6xl mx-auto">
          <PricingCard
            {...pricingPlans.starter}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            {...pricingPlans.pro}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            {...pricingPlans.founders}
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