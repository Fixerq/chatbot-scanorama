
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscriptionManagement } from './useSubscriptionManagement';
import { SupportDialog } from './SupportDialog';
import { RecentSearchDialog } from './RecentSearchDialog';

const NavigationActions = () => {
  const { handleSubscriptionAction, isSubscriptionLoading, currentPlan } = useSubscriptionManagement();

  return (
    <div className="flex items-center gap-3">
      <RecentSearchDialog />
      <SupportDialog />
      
      <Link to="/dashboard" className="text-sm text-slate-200 hover:text-cyan-400 transition-colors">
        Dashboard
      </Link>
      
      <Button 
        onClick={handleSubscriptionAction}
        disabled={isSubscriptionLoading}
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none"
      >
        {isSubscriptionLoading ? 'Loading...' : currentPlan === 'pro' ? 'Manage Subscription' : 'Upgrade Plan'}
      </Button>
    </div>
  );
};

export default NavigationActions;
