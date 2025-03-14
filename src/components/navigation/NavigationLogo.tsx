
import React from 'react';
import { Link } from 'react-router-dom';

const NavigationLogo = () => {
  return (
    <Link to="/dashboard" className="flex items-center gap-2">
      <span className="text-xl font-bold text-white">Detectify</span>
    </Link>
  );
};

export default NavigationLogo;
