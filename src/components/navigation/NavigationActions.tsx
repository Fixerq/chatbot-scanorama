import React from 'react';
import { Button } from '@/components/ui/button';
import { Search, CreditCard, LogOut, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { SubscriptionStatus } from '../SubscriptionStatus';

interface NavigationActionsProps {
  onSearchClick: () => void;
  onSubscriptionClick: () => void;
  onLogout: () => void;
  isSubscriptionLoading: boolean;
}

export const NavigationActions = ({
  onSearchClick,
  onSubscriptionClick,
  onLogout,
  isSubscriptionLoading
}: NavigationActionsProps) => {
  return (
    <div className="flex items-center gap-4">
      <SubscriptionStatus />
      
      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={onSearchClick}
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Recent Searches</span>
      </Button>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={onSubscriptionClick}
              disabled={isSubscriptionLoading}
            >
              {isSubscriptionLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                Manage Subscription
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Click to manage your subscription</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Button
        variant="ghost"
        size="sm"
        className="gap-2"
        onClick={onLogout}
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline">Logout</span>
      </Button>
    </div>
  );
};