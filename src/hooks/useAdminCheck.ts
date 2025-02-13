
import { supabase } from '@/integrations/supabase/client';

export const useAdminCheck = () => {
  const checkAdminStatus = async (userId: string) => {
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
