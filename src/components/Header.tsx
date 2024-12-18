import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Image } from "lucide-react";

const Header = () => {
  const [imageError, setImageError] = useState(false);

  return (
    <div className="relative mb-12">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-lg blur-xl" />
      
      <Card className="relative bg-white/90 backdrop-blur-sm border-none shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center space-y-6">
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur opacity-30" />
              {!imageError ? (
                <img 
                  src="/lovable-uploads/engage-logo.png"
                  alt="EngageAI Logo" 
                  className="relative h-20 w-auto hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    console.error('Image failed to load:', e.currentTarget.src);
                    setImageError(true);
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-20 w-20 bg-gray-100 rounded-full">
                  <Image className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              EngageAI Chatbot Detection App
            </h1>
            
            <p className="text-gray-600 max-w-2xl text-center leading-relaxed">
              Discover integrated chatbot platforms across your web properties with our advanced detection tool. 
              Simply upload a CSV file with your URLs, and we'll identify popular platforms like Drift, Intercom, 
              HubSpot, and more. Perfect for digital marketers and web administrators looking to analyze their 
              customer engagement tools.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Header;