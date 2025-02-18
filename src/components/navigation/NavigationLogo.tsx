
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export const NavigationLogo = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="mr-4 flex">
      <Link to={isAdminRoute ? "/admin" : "/"} className="mr-6 flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">
          {isAdminRoute ? 'Admin Console' : 'Detectify'}
        </span>
      </Link>
    </div>
  );
};
