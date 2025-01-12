import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, Search, Settings } from 'lucide-react';
import { SubscriptionStatus } from '../SubscriptionStatus';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

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
  isSubscriptionLoading,
}: NavigationActionsProps) => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('user_id')
        .single();
      
      setIsAdmin(!!adminData);
    };

    checkAdminStatus();
  }, [supabase]);

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onSearchClick}
        className="h-9 w-9"
      >
        <Search className="h-4 w-4" />
      </Button>

      <SubscriptionStatus />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {isAdmin && (
            <DropdownMenuItem onClick={() => navigate('/admin')}>
              Admin Panel
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={onSubscriptionClick}>
            {isSubscriptionLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Manage Subscription'
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};