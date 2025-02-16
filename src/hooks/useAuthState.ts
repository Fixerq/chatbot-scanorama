
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
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session check error:', sessionError);
          if (mounted.current) {
            setError('Error checking session status');
            navigate('/login');
          }
          return;
        }

        if (!session) {
          console.log('No session found, redirecting to login');
          if (mounted.current && window.location.pathname !== '/login') {
            navigate('/login');
          }
          return;
        }

        if (mounted.current) {
          console.log('Valid session found, checking admin status');
          const isAdmin = await checkAdminStatus(session.user.id);
          navigate(isAdmin ? '/admin' : '/dashboard');
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted.current) {
          setError('Error checking session status');
          navigate('/login');
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth event:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            try {
              const isAdmin = await checkAdminStatus(session.user.id);
              if (mounted.current) {
                navigate(isAdmin ? '/admin' : '/dashboard');
                toast.success('Successfully signed in!');
              }
            } catch (error) {
              console.error('Auth state change error:', error);
              if (mounted.current) {
                setError('Error processing your authentication');
                navigate('/login');
              }
            }
          }
          break;

        case 'SIGNED_OUT':
          if (mounted.current) {
            setError('');
            navigate('/login');
          }
          break;

        case 'TOKEN_REFRESHED':
          console.log('Token refreshed successfully');
          break;

        case 'USER_DELETED':
        case 'USER_UPDATED':
          // Handle these events if needed
          break;
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
