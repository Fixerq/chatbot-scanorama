
import React from 'react';
import { Button } from "@/components/ui/button";
import { LogOut } from 'lucide-react';
import { useNavigation } from './useNavigation';
import { useLocation } from 'react-router-dom';
import { AdminNavigationItems } from './AdminNavigationItems';

export const NavigationActions = () => {
  const { handleLogout, isSubscriptionLoading } = useNavigation();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="ml-auto flex items-center space-x-4">
      {isAdminRoute && <AdminNavigationItems />}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        disabled={isSubscriptionLoading}
        className="text-muted-foreground hover:text-primary"
      >
        <LogOut className="h-4 w-4 mr-2" />
        Logout
      </Button>
    </div>
  );
};
