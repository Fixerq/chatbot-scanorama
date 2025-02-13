
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from './useAdminCheck';
import { AuthState } from '@/types/auth';

export const useAuthState = (): AuthState => {
  const navigate = useNavigate();
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(true);
  const authStateSubscription = useRef<{ data: { subscription: { unsubscribe: () => void } } }>();
  const { checkAdminStatus } = useAdminCheck();

  useEffect(() => {
    const checkSession = async () => {
      if (!mounted.current) return;
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && mounted.current) {
          const isAdmin = await checkAdminStatus(session.user.id);
          if (isAdmin) {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted.current) {
          setError('Error checking session status');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    checkSession();
    
    return () => {
      mounted.current = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!mounted.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth event:', event);
      
      if (event === 'SIGNED_IN' && session) {
        try {
          const isAdmin = await checkAdminStatus(session.user.id);
          if (mounted.current) {
            if (isAdmin) {
              navigate('/admin');
            } else {
              navigate('/dashboard');
            }
            toast.success('Successfully signed in!');
          }
        } catch (error) {
          console.error('Auth state change error:', error);
          if (mounted.current) {
            setError('Error processing your authentication. Please try again.');
          }
        }
      }
      
      if (event === 'PASSWORD_RECOVERY' && mounted.current) {
        navigate('/reset-password');
      }

      if (event === 'SIGNED_OUT' && mounted.current) {
        setError('');
      }
    });

    authStateSubscription.current = { data: { subscription } };

    return () => {
      if (authStateSubscription.current?.data.subscription) {
        authStateSubscription.current.data.subscription.unsubscribe();
      }
    };
  }, [navigate]);

  return { error, setError, isLoading };
};
