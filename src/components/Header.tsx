import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Search, BarChart3 } from 'lucide-react';

const Header = () => {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 via-blue-600/30 to-cyan-600/30 rounded-[2rem] blur-xl animate-gradient" />
      
      <Card className="relative bg-black/40 backdrop-blur-lg border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
        <CardContent className="pt-8 pb-10 px-8">
          <div className="flex flex-col items-center space-y-8">            
            <div className="relative">
              <h1 className="text-5xl font-bold text-white animate-fade-in" style={{
                textShadow: `
                  0 0 20px rgba(6, 182, 212, 0.7),
                  0 0 40px rgba(6, 182, 212, 0.5),
                  0 0 60px rgba(6, 182, 212, 0.3)
                `
              }}>
                EngageAI Chatbot Detection
              </h1>
            </div>
            
            <p className="text-white text-opacity-90 max-w-2xl text-center leading-relaxed text-lg animate-fade-in delay-100 font-medium">
              Discover integrated chatbot platforms across your web properties with our advanced detection tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-4">
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <Bot className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500" 
                     style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div className="text-sm">
                  <p className="font-semibold text-white mb-1">AI-Powered Detection</p>
                  <p className="text-cyan-100 text-opacity-80">Accurate chatbot identification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <Search className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500"
                       style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div className="text-sm">
                  <p className="font-semibold text-white mb-1">Bulk Analysis</p>
                  <p className="text-cyan-100 text-opacity-80">Process multiple URLs at once</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] bg-black/50 backdrop-blur-xl border border-cyan-500/30 shadow-lg hover:shadow-xl transition-all duration-500 group hover:bg-black/60">
                <BarChart3 className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500"
                          style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.5))' }} />
                <div className="text-sm">
                  <p className="font-semibold text-white mb-1">Detailed Reports</p>
                  <p className="text-cyan-100 text-opacity-80">Comprehensive insights</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Header;