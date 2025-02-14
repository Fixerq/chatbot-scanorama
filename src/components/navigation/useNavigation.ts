
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { useSubscriptionManagement } from './useSubscriptionManagement';

export const useNavigation = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const { handleSubscriptionAction, isSubscriptionLoading } = useSubscriptionManagement();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear any local storage keys related to auth
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (supabaseUrl) {
        const authTokenKey = `sb-${supabaseUrl.split('//')[1]}-auth-token`;
        localStorage.removeItem(authTokenKey);
      }
      
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return {
    handleSubscriptionAction,
    isSubscriptionLoading,
    handleLogout
  };
};
