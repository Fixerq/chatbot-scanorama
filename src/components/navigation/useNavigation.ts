
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
      // Clear local auth data first
      await clearAuthData();
      
      // Show success message
      toast.success('Logged out successfully');
      
      // Redirect to login page
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Unexpected error during logout:', error);
      // Even if there's an error, ensure we clear local data and redirect
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

