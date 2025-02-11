
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Loader2, MessageCircle, Settings } from 'lucide-react';
import { SubscriptionStatus } from '../SubscriptionStatus';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { SupportDialog } from './SupportDialog';

interface NavigationActionsProps {
  onSubscriptionClick: () => void;
  onLogout: () => void;
  isSubscriptionLoading: boolean;
}

export const NavigationActions = ({
  onSubscriptionClick,
  onLogout,
  isSubscriptionLoading,
}: NavigationActionsProps) => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const session = useSession();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isSupportOpen, setIsSupportOpen] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(true);

  React.useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.id) {
        setIsChecking(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error in admin check:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkAdminStatus();
  }, [session, supabase]);

  return (
    <div className="flex items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsSupportOpen(true)}
        className="h-9 w-9"
      >
        <MessageCircle className="h-4 w-4" />
      </Button>

      <SubscriptionStatus />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!isChecking && isAdmin && (
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

      <SupportDialog 
        open={isSupportOpen}
        onOpenChange={setIsSupportOpen}
      />
    </div>
  );
};
