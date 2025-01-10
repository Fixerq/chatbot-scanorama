import React from 'react';
import { Link } from 'react-router-dom';

export const NavigationLogo = () => {
  return (
    <div className="mr-4 flex">
      <Link to="/dashboard" className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">
          Detectify
        </span>
      </Link>
    </div>
  );
};