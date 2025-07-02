
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
      
      // Get current user session first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setIsAdmin(false);
        return false;
      }

      // Check if current user is in admin_users table
      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
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
