
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { useSubscriptionManagement } from './useSubscriptionManagement';
import { clearAuthData } from '@/integrations/supabase/client';

export const useNavigation = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { handleSubscriptionAction, isSubscriptionLoading } = useSubscriptionManagement();

  const handleLogout = async () => {
    try {
      // First try to sign out locally
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error during signout:', error);
        // Even if server logout fails, clear local auth data
        await clearAuthData();
        toast.error('There was an issue logging out, but you have been logged out locally');
      } else {
        await clearAuthData();
        toast.success('Logged out successfully');
      }
      
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Even if there's an unexpected error, clear local auth data
      await clearAuthData();
      navigate('/login', { replace: true });
      toast.error('There was an issue logging out, but you have been logged out locally');
    }
  };

  return {
    handleSubscriptionAction,
    isSubscriptionLoading,
    handleLogout
  };
};
