
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SessionProvider } from './SessionProvider';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;
    
    const handleLogout = async () => {
      // Clear auth state and storage
      await supabase.auth.signOut();
      localStorage.clear();
      toast.info('You have been logged out due to inactivity');
      navigate('/login');
    };

    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    };

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    resetInactivityTimer();

    return () => {
      clearTimeout(inactivityTimeout);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [navigate]);

  return <SessionProvider>{children}</SessionProvider>;
};
