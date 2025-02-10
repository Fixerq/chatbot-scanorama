
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    let inactivityTimeout: NodeJS.Timeout;
    
    // Function to handle user logout
    const handleLogout = async () => {
      // First clear storage, then sign out
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      }
      await supabase.auth.signOut();
      toast.info('You have been logged out due to inactivity');
      navigate('/login');
    };

    // Reset the inactivity timer
    const resetInactivityTimer = () => {
      clearTimeout(inactivityTimeout);
      inactivityTimeout = setTimeout(handleLogout, 30 * 60 * 1000); // 30 minutes
    };

    // Set up event listeners for user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'mousemove'];
    activityEvents.forEach(event => {
      document.addEventListener(event, resetInactivityTimer);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
        resetInactivityTimer(); // Reset timer on token refresh
      }
      
      if (event === 'SIGNED_OUT') {
        // First clear storage, then handle navigation
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('sb-')) {
            sessionStorage.removeItem(key);
          }
        }
        navigate('/login');
      }
    });

    // Handle refresh token errors
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        console.log('Session expired or refresh token invalid');
        // First clear storage, then handle navigation
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith('sb-')) {
            localStorage.removeItem(key);
          }
        }
        for (const key of Object.keys(sessionStorage)) {
          if (key.startsWith('sb-')) {
            sessionStorage.removeItem(key);
          }
        }
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login');
      }
    });

    // Cleanup function
    return () => {
      subscription.unsubscribe();
      clearTimeout(inactivityTimeout);
      activityEvents.forEach(event => {
        document.removeEventListener(event, resetInactivityTimer);
      });
    };
  }, [navigate]);

  return <>{children}</>;
};
