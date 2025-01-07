import React from 'react';
import { Card } from "@/components/ui/card";

const BenefitsSection = () => {
  return (
    <section className="relative py-12">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-cyan-500/5 blur-xl" />
      
      <Card className="relative max-w-3xl mx-auto space-y-8 p-8 bg-black/40 backdrop-blur-lg border-cyan-500/20 glow-border">
        <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 animate-gradient glow-text">
          Listen Up:
        </h2>
        
        <div className="space-y-6">
          <p className="text-xl text-cyan-50 animate-fade-in delay-100">
            If you're trying to sell conversational AI solutions, your biggest challenge isn't just building the product—it's knowing <span className="font-semibold text-cyan-300">who to sell to</span>.
          </p>
          
          <p className="text-xl text-cyan-50 animate-fade-in delay-200">
            Most businesses waste valuable time chasing leads that go nowhere because they're shooting in the dark.
          </p>
          
          <div className="pt-4 space-y-4 animate-fade-in delay-300">
            <p className="text-2xl font-bold text-cyan-400">
              Detectify changes that.
            </p>
            <p className="text-xl text-cyan-50">
              It helps you identify and target businesses already using chatbots, so you can focus on qualified prospects ready for your solution.
            </p>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default BenefitsSection;