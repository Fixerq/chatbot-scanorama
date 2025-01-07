import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Search, BarChart3 } from 'lucide-react';

const Header = () => {
  return (
    <div className="relative mb-12">
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-cyan-600/20 rounded-[2rem] blur-xl animate-gradient" />
      
      <Card className="relative bg-black/20 backdrop-blur-sm border-none shadow-xl hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
        <CardContent className="pt-8 pb-10 px-8">
          <div className="flex flex-col items-center space-y-8">            
            <div className="relative">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent animate-fade-in glow-text">
                EngageAI Chatbot Detection
              </h1>
            </div>
            
            <p className="text-cyan-100/80 max-w-2xl text-center leading-relaxed text-lg animate-fade-in delay-100">
              Discover integrated chatbot platforms across your web properties with our advanced detection tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-4">
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] card-gradient border border-cyan-500/20 shadow-lg hover:shadow-xl transition-all duration-500 group glow-border">
                <Bot className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
                <div className="text-sm">
                  <p className="font-semibold text-cyan-100 mb-1">AI-Powered Detection</p>
                  <p className="text-cyan-200/70">Accurate chatbot identification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] card-gradient border border-cyan-500/20 shadow-lg hover:shadow-xl transition-all duration-500 group glow-border">
                <Search className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
                <div className="text-sm">
                  <p className="font-semibold text-cyan-100 mb-1">Bulk Analysis</p>
                  <p className="text-cyan-200/70">Process multiple URLs at once</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-6 rounded-[1.25rem] card-gradient border border-cyan-500/20 shadow-lg hover:shadow-xl transition-all duration-500 group glow-border">
                <BarChart3 className="w-12 h-12 text-cyan-400 group-hover:scale-110 transition-transform duration-500" />
                <div className="text-sm">
                  <p className="font-semibold text-cyan-100 mb-1">Detailed Reports</p>
                  <p className="text-cyan-200/70">Comprehensive insights</p>
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