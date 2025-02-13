
import { supabase } from '@/integrations/supabase/client';
import { AdminCheck } from '@/types/auth';

export const useAdminCheck = (): AdminCheck => {
  const checkAdminStatus = async (userId: string): Promise<boolean> => {
    try {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!adminError && adminData) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  return { checkAdminStatus };
};
