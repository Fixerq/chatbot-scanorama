
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
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .maybeSingle();

      if (error) {
        console.error('Admin check error:', error);
        toast.error('You do not have admin access');
        navigate('/dashboard');
        return false;
      }
      
      const hasAdminAccess = !!data;
      setIsAdmin(hasAdminAccess);
      
      if (!hasAdminAccess) {
        toast.error('You do not have admin access');
        navigate('/dashboard');
      }
      
      return hasAdminAccess;
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
