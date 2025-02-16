
import { supabase } from '@/integrations/supabase/client';
import { AdminCheck } from '@/types/auth';

export const useAdminCheck = (): AdminCheck => {
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .rpc('is_admin_direct_v2', { user_id: userId });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in checkAdminStatus:', error);
      return false;
    }
  };

  return { checkAdminStatus };
};
