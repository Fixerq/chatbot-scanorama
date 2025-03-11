
import React from 'react';
import NavigationLogo from './navigation/NavigationLogo';
import NavigationActions from './navigation/NavigationActions';
import { useNavigation } from './navigation/useNavigation';

const NavigationBar = () => {
  const {
    handleSubscriptionAction,
    isSubscriptionLoading,
    handleLogout
  } = useNavigation();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <NavigationLogo />
        <NavigationActions
          onSubscriptionClick={handleSubscriptionAction}
          onLogout={handleLogout}
          isSubscriptionLoading={isSubscriptionLoading}
        />
      </div>
    </nav>
  );
};

export default NavigationBar;
