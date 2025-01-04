import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Bot, Search, FileText, BarChart3 } from 'lucide-react';

const Header = () => {
  return (
    <div className="relative mb-12">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg blur-xl" />
      
      <Card className="relative bg-white/90 backdrop-blur-sm border-none shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EngageAI Chatbot Detection
            </h1>
            
            <p className="text-gray-600 max-w-2xl text-center leading-relaxed">
              Discover integrated chatbot platforms across your web properties with our advanced detection tool.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mt-4">
              <div className="flex items-center gap-3 text-gray-600">
                <Bot className="w-8 h-8 text-blue-600" />
                <div className="text-sm">
                  <p className="font-semibold">AI-Powered Detection</p>
                  <p>Accurate chatbot identification</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-gray-600">
                <Search className="w-8 h-8 text-blue-600" />
                <div className="text-sm">
                  <p className="font-semibold">Bulk Analysis</p>
                  <p>Process multiple URLs at once</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 text-gray-600">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <div className="text-sm">
                  <p className="font-semibold">Detailed Reports</p>
                  <p>Comprehensive insights</p>
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