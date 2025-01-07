import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Search, Zap, Target } from 'lucide-react';

const FeaturesSection = () => {
  return (
    <section className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-white mb-8">
        Why Detectify Is Your Unfair Advantage
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <Search className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">You're Losing Money on Bad Prospects</h3>
            <p className="text-gray-300">Find highly qualified leads already investing in chatbot technology and ready to buy.</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <Zap className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">Speed = Success</h3>
            <p className="text-gray-300">Scan the internet or upload your list. In minutes, get the data you need to close deals.</p>
          </CardContent>
        </Card>

        <Card className="bg-black/60 backdrop-blur-lg border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300">
          <CardContent className="p-6 space-y-4">
            <div className="rounded-full bg-cyan-500/10 w-12 h-12 flex items-center justify-center">
              <Target className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-semibold text-white">You'll Outperform Your Competitors</h3>
            <p className="text-gray-300">Target smarter with insights about the exact chatbot platforms businesses use.</p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default FeaturesSection;