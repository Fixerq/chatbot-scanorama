
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
          await checkAdminStatus(session.user.id);
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted.current) {
          setError('Error checking session status');
          navigate('/login');
        }
      } finally {
        // Always set loading to false after a reasonable timeout
        setTimeout(() => {
          if (mounted.current && isLoading) {
            setIsLoading(false);
          }
        }, 3000);
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
                if (isAdmin) {
                  console.log('User is admin, navigating to admin page');
                  navigate('/admin');
                } else {
                  console.log('User is not admin, navigating to dashboard');
                  navigate('/dashboard');
                }
                toast.success('Successfully signed in!');
              }
            } catch (error) {
              console.error('Auth state change error:', error);
              if (mounted.current) {
                setError('Error processing your authentication');
                navigate('/login');
              }
            } finally {
              if (mounted.current) {
                setIsLoading(false);
              }
            }
          }
          break;

        case 'SIGNED_OUT':
          if (mounted.current) {
            setError('');
            setIsLoading(false);
            navigate('/login');
          }
          break;

        default:
          console.log('Unhandled auth event:', event);
          if (mounted.current) {
            setIsLoading(false);
          }
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
