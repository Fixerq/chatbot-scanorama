import React from 'react';
import Header from '@/components/Header';
import FeaturesSection from '@/components/sales/FeaturesSection';
import BenefitsSection from '@/components/sales/BenefitsSection';
import CtaSection from '@/components/sales/CtaSection';

const SalesPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Header />
        
        <div className="space-y-16 pb-16 animate-fade-in">
          <FeaturesSection />
          <BenefitsSection />
          <CtaSection />
        </div>
      </div>
    </div>
  );
};

export default SalesPage;