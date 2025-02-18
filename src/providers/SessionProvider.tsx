
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { clearAuthData } from '@/integrations/supabase/client';

interface SessionContextType {
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const supabase = useSupabaseClient();
  const session = useSession();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const mounted = useRef(true);
  const refreshTimeout = useRef<NodeJS.Timeout>();
  const initializationTimeout = useRef<NodeJS.Timeout>();

  const refreshSession = async () => {
    if (!mounted.current) return;

    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        if (mounted.current) {
          await clearAuthData();
          navigate('/login');
          toast.error('Your session has expired. Please sign in again.');
        }
        return;
      }

      if (!newSession) {
        if (mounted.current && window.location.pathname !== '/login') {
          await clearAuthData();
          navigate('/login');
        }
        return;
      }

      if (mounted.current) {
        setIsAuthenticated(true);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      if (mounted.current) {
        await clearAuthData();
        navigate('/login');
        toast.error('An error occurred with your session. Please sign in again.');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        console.log('Initializing session check...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session initialization error:', error);
          throw error;
        }

        if (!session) {
          console.log('No initial session found');
          if (isMounted && window.location.pathname !== '/login') {
            await clearAuthData();
            navigate('/login');
          }
        } else {
          console.log('Initial session found');
          if (isMounted) {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (isMounted) {
          await clearAuthData();
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, 'Session:', !!currentSession);
      
      if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, setting authenticated state');
        if (isMounted) {
          setIsAuthenticated(true);
          setIsLoading(false);
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing auth state');
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          await clearAuthData();
          navigate('/login');
        }
      }
    });

    return () => {
      isMounted = false;
      mounted.current = false;
      subscription?.unsubscribe();
      if (refreshTimeout.current) {
        clearInterval(refreshTimeout.current);
      }
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [navigate, supabase]);

  return (
    <SessionContext.Provider value={{
      isLoading,
      isAuthenticated,
      refreshSession
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext must be used within a SessionProvider');
  }
  return context;
};
