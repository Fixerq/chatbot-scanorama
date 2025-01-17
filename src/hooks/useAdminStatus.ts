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
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .single();

      if (adminError || !adminData) {
        console.error('Admin check error:', adminError);
        toast.error('You do not have admin access');
        navigate('/dashboard');
        return false;
      }
      setIsAdmin(true);
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