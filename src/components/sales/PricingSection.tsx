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
            name={pricingPlans.starter.name}
            price={pricingPlans.starter.price}
            description={pricingPlans.starter.description}
            features={pricingPlans.starter.features}
            priceId={pricingPlans.starter.priceId}
            productId={pricingPlans.starter.productId}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            name={pricingPlans.pro.name}
            price={pricingPlans.pro.price}
            description={pricingPlans.pro.description}
            features={pricingPlans.pro.features}
            priceId={pricingPlans.pro.priceId}
            productId={pricingPlans.pro.productId}
            popular={pricingPlans.pro.popular}
            onSubscribe={handleSubscribe}
            isLoading={isLoading}
            hasSubscription={hasSubscription}
          />
          
          <PricingCard
            name={pricingPlans.founders.name}
            price={pricingPlans.founders.price}
            description={pricingPlans.founders.description}
            features={pricingPlans.founders.features}
            priceId={pricingPlans.founders.priceId}
            productId={pricingPlans.founders.productId}
            special={pricingPlans.founders.special}
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