import React from 'react';

const Header = () => {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-6">
        <img 
          src="lovable-uploads/engage-logo.png" 
          alt="EngageAI Logo" 
          className="h-16 w-auto"
          onError={(e) => {
            console.error('Image failed to load:', e);
            const img = e.target as HTMLImageElement;
            console.log('Attempted image path:', img.src);
          }}
        />
      </div>
      <h1 className="text-4xl font-bold mb-4">EngageAI Chatbot Detection App</h1>
      <p className="text-gray-600 max-w-2xl mx-auto">
        Discover integrated chatbot platforms across your web properties with our advanced detection tool. 
        Simply upload a CSV file with your URLs, and we'll identify popular platforms like Drift, Intercom, 
        HubSpot, and more. Perfect for digital marketers and web administrators looking to analyze their 
        customer engagement tools.
      </p>
    </div>
  );
};

export default Header;