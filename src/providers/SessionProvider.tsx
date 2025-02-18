
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

      // Set loading to false after successful session check
      if (mounted.current) {
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
          if (mounted.current && window.location.pathname !== '/login') {
            await clearAuthData();
            navigate('/login');
          }
        } else {
          console.log('Initial session found');
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted.current) {
          await clearAuthData();
          navigate('/login');
        }
      } finally {
        // Set a maximum timeout for initialization
        initializationTimeout.current = setTimeout(() => {
          if (mounted.current && isLoading) {
            console.log('Forcing loading state to complete after timeout');
            setIsLoading(false);
          }
        }, 3000);
      }
    };

    initialize();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed:', event, 'Session:', !!currentSession);
      
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        if (mounted.current) {
          setIsLoading(false);
          await clearAuthData();
          navigate('/login');
        }
      } else if (event === 'SIGNED_IN' && currentSession) {
        console.log('User signed in, refreshing session');
        await refreshSession();
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    });

    return () => {
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
      isAuthenticated: !!session?.user,
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

