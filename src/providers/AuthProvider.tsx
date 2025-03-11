
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("AuthProvider initialized");
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event in provider:", event);
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login');
        // Use replace instead of navigate to avoid adding to history stack
        navigate('/login', { replace: true });
        toast.info('You have been signed out');
      }

      if (event === 'SIGNED_IN') {
        console.log('User signed in via AuthProvider');
      }
    });

    // Handle refresh token errors
    const authErrorSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        console.log('Session expired or refresh token invalid');
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
      if (authErrorSubscription) {
        authErrorSubscription.unsubscribe();
      }
    };
  }, [navigate]);

  return <>{children}</>;
};
