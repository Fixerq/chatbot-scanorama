import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Search, BarChart3, Rocket } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Transform Your Sales Process
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <Search className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Local Business Discovery</h3>
            <p className="text-gray-300">Identify businesses in any location and receive a curated list of URLs.</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Website Analysis</h3>
            <p className="text-gray-300">Detect and analyze chatbot technologies on each site with precision.</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <Rocket className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">AI-Driven Insights</h3>
            <p className="text-gray-300">Gain deep understanding of chatbot integrations to tailor your strategy.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FeaturesSection;