
import React from 'react';
import { Link } from 'react-router-dom';

const NavigationLogo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <img 
        src="/lovable-uploads/engage-logo.png"
        alt="Engage AI Logo"
        className="h-8 w-auto"
      />
      <span className="text-xl font-bold text-white">Engage<span className="text-cyan-400">AI</span></span>
    </Link>
  );
};

export default NavigationLogo;
