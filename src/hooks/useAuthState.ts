
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAdminCheck } from './useAdminCheck';
import { AuthState } from '@/types/auth';
import { AuthError, AuthChangeEvent, Session } from '@supabase/supabase-js';

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
          if (isAdmin) {
            console.log('User is admin, redirecting to admin page');
            navigate('/admin');
          } else {
            console.log('User is not admin, redirecting to dashboard');
            navigate('/dashboard');
          }
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
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

        case 'USER_UPDATED':
          console.log('User profile updated');
          break;

        case 'INITIAL_SESSION':
          console.log('Initial session loaded');
          break;

        default:
          console.log('Unhandled auth event:', event);
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

