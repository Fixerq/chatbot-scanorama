
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useAdminStatus = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  const checkAdminStatus = async () => {
    try {
      setIsChecking(true);
      const { data: session } = await supabase.auth.getSession();

      if (!session?.session?.user?.id) {
        console.log('No active session found');
        setIsAdmin(false);
        navigate('/login');
        return false;
      }

      // Simple admin check using the admin_users table
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is expected for non-admins
        console.error('Admin check error:', adminError);
        toast.error('Error checking admin status');
        return false;
      }

      const hasAdminAccess = !!adminData;
      console.log('Admin status:', hasAdminAccess);
      setIsAdmin(hasAdminAccess);
      
      if (!hasAdminAccess) {
        navigate('/dashboard');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Admin check error:', error);
      toast.error('Failed to verify admin status');
      navigate('/dashboard');
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkAdminStatus();
  }, []);

  return { isAdmin, isChecking, checkAdminStatus };
};
