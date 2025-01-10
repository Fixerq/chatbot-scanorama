import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';
import { useSubscriptionManagement } from './useSubscriptionManagement';

export const useNavigation = () => {
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [isSearchesOpen, setIsSearchesOpen] = useState(false);
  const { handleSubscriptionAction, isSubscriptionLoading } = useSubscriptionManagement();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  return {
    isSearchesOpen,
    setIsSearchesOpen,
    handleSubscriptionAction,
    isSubscriptionLoading,
    handleLogout
  };
};