
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
  const { checkAdminStatus } = useAdminCheck();
  const authStateSubscription = useRef<{ data: { subscription: { unsubscribe: () => void } } }>();
  const initializationTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const checkSession = async () => {
      if (!mounted.current) return;
      
      try {
        console.log('Checking session status...');
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Session check error:', sessionError);
          if (mounted.current) {
            setError(sessionError.message);
            navigate('/login');
          }
          return;
        }

        if (!session) {
          console.log('No session found during check');
          if (mounted.current && window.location.pathname !== '/login') {
            setIsLoading(false);
            navigate('/login');
          }
          return;
        }

        if (mounted.current) {
          console.log('Valid session found, checking admin status');
          await checkAdminStatus(session.user.id);
          setIsLoading(false);
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
    
    // Set a timeout to prevent infinite loading
    initializationTimeout.current = setTimeout(() => {
      if (mounted.current && isLoading) {
        console.log('Forcing auth state loading to complete after timeout');
        setIsLoading(false);
      }
    }, 5000);
    
    return () => {
      mounted.current = false;
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [navigate, checkAdminStatus]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed in useAuthState:', event, 'Session:', !!session);
      
      switch (event) {
        case 'SIGNED_IN':
          if (session) {
            try {
              const isAdmin = await checkAdminStatus(session.user.id);
              if (mounted.current) {
                setIsLoading(false);
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
                setIsLoading(false);
                navigate('/login');
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
  }, [navigate, checkAdminStatus]);

  return { error, setError, isLoading };
};
