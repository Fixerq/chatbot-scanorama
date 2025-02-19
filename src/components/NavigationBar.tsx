
import React from 'react';
import { NavigationLogo } from './navigation/NavigationLogo';
import { NavigationActions } from './navigation/NavigationActions';

const NavigationBar = () => {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <NavigationLogo />
        <NavigationActions />
      </div>
    </nav>
  );
};

export default NavigationBar;
