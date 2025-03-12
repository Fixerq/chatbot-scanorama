
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSubscriptionManagement } from './useSubscriptionManagement';
import { SupportDialog } from './SupportDialog';
import { RecentSearchDialog } from './RecentSearchDialog';

interface NavigationActionsProps {
  onSubscriptionClick?: () => Promise<void>;
  onLogout?: () => Promise<void>;
  isSubscriptionLoading?: boolean;
}

const NavigationActions = ({ 
  onSubscriptionClick, 
  onLogout,
  isSubscriptionLoading: externalLoading
}: NavigationActionsProps = {}) => {
  const { 
    handleSubscriptionAction, 
    isSubscriptionLoading: internalLoading, 
    currentPlan 
  } = useSubscriptionManagement();
  
  const [isSupportDialogOpen, setIsSupportDialogOpen] = useState(false);
  const [isRecentSearchDialogOpen, setIsRecentSearchDialogOpen] = useState(false);
  
  // Use external props if provided, otherwise use internal ones
  const loading = externalLoading !== undefined ? externalLoading : internalLoading;
  const handleSubscription = onSubscriptionClick || handleSubscriptionAction;

  return (
    <div className="flex items-center gap-3">
      <RecentSearchDialog 
        open={isRecentSearchDialogOpen} 
        onOpenChange={setIsRecentSearchDialogOpen} 
      />
      
      <SupportDialog 
        open={isSupportDialogOpen} 
        onOpenChange={setIsSupportDialogOpen}
      />
      
      <Link to="/dashboard" className="text-sm text-slate-200 hover:text-cyan-400 transition-colors">
        Dashboard
      </Link>
      
      <Button 
        onClick={handleSubscription}
        disabled={loading}
        variant="default"
        size="sm"
        className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white border-none"
      >
        {loading ? 'Loading...' : currentPlan === 'pro' ? 'Manage Subscription' : 'Upgrade Plan'}
      </Button>
      
      {onLogout && (
        <Button
          onClick={onLogout}
          variant="ghost"
          size="sm"
          className="text-slate-200 hover:text-cyan-400 hover:bg-transparent"
        >
          Logout
        </Button>
      )}
    </div>
  );
};

export default NavigationActions;
