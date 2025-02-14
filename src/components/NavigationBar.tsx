
import React from 'react';
import { NavigationLogo } from './navigation/NavigationLogo';

const NavigationBar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <NavigationLogo />
      </div>
    </nav>
  );
};

export default NavigationBar;
