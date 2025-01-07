import React from 'react';
import Header from '@/components/Header';
import FeaturesSection from '@/components/sales/FeaturesSection';
import BenefitsSection from '@/components/sales/BenefitsSection';
import PricingSection from '@/components/sales/PricingSection';
import CtaSection from '@/components/sales/CtaSection';

const SalesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Header />
        
        <div className="space-y-16 pb-16 animate-fade-in">
          <FeaturesSection />
          <BenefitsSection />
        </div>
      </div>
      
      <PricingSection />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <CtaSection />
      </div>
    </div>
  );
};

export default SalesPage;