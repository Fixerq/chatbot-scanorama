import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Search, FileText, BarChart3 } from 'lucide-react';

const Header = () => {
  return (
    <div className="relative mb-12">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-pink-600/30 rounded-lg blur-xl animate-gradient" />
      
      <Card className="relative bg-white/90 backdrop-blur-sm border-none shadow-xl hover:shadow-2xl transition-all duration-300">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">            
            <div className="relative">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 bg-clip-text text-transparent animate-fade-in">
                EngageAI Chatbot Detection
              </h1>
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 blur-lg -z-10" />
            </div>
            
            <p className="text-gray-600 max-w-2xl text-center leading-relaxed text-lg animate-fade-in delay-100">
              Discover integrated chatbot platforms across your web properties with our advanced detection tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-4xl mt-4">
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group">
                <Bot className="w-10 h-10 text-purple-600 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">AI-Powered Detection</p>
                  <p className="text-gray-600">Accurate chatbot identification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group">
                <Search className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">Bulk Analysis</p>
                  <p className="text-gray-600">Process multiple URLs at once</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 group">
                <BarChart3 className="w-10 h-10 text-pink-600 group-hover:scale-110 transition-transform duration-300" />
                <div className="text-sm">
                  <p className="font-semibold text-gray-800">Detailed Reports</p>
                  <p className="text-gray-600">Comprehensive insights</p>
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