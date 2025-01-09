import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Search, BarChart3, Crown } from 'lucide-react';

const Header = () => {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-cyan-600/30 rounded-[2rem] blur-xl animate-gradient" />
      
      <Card className="relative bg-black/60 backdrop-blur-lg border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
        <CardContent className="pt-12 pb-14 px-8">
          <div className="flex flex-col items-center space-y-10">            
            <div className="text-center space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-400/20 mb-4">
                <Crown className="w-5 h-5 text-cyan-400" />
                <span className="text-cyan-400 font-semibold">Founders Plan Now Available</span>
              </div>
              <h1 className="text-6xl font-bold text-white animate-fade-in tracking-tight" style={{
                textShadow: `
                  0 0 30px rgba(6, 182, 212, 0.9),
                  0 0 60px rgba(6, 182, 212, 0.6)
                `
              }}>
                Find, Target, and Close Qualified Leads Faster
              </h1>
              <h2 className="text-4xl font-bold text-cyan-400 animate-fade-in delay-75">Detectify</h2>
              <p className="text-2xl font-medium text-cyan-400 animate-fade-in delay-100">by EngageAI</p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <p className="text-white/90 text-center leading-relaxed text-xl animate-fade-in delay-200 font-medium">
                Identify businesses already using chatbot technologies and get the data you need to close deals smarter.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-4">
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <Bot className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500" 
                     style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div>
                  <p className="font-semibold text-white mb-2">Local Business Discovery</p>
                  <p className="text-cyan-100 text-opacity-90 text-sm">Search and discover businesses in any location, tailored to your niche.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <Search className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500"
                       style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div>
                  <p className="font-semibold text-white mb-2">Website Analysis</p>
                  <p className="text-cyan-100 text-opacity-90 text-sm">Identify existing chatbot platforms to tailor your pitch.</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-2xl bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <BarChart3 className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500"
                          style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div>
                  <p className="font-semibold text-white mb-2">AI-Driven Insights</p>
                  <p className="text-cyan-100 text-opacity-90 text-sm">Leverage data to streamline prospecting and close faster.</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-400/20">
              <p className="text-cyan-100 text-center text-sm">
                <span className="font-semibold">Founders Plan Benefits:</span> Unlimited Searches • Advanced Analytics • Priority Support • Early Access
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Header;