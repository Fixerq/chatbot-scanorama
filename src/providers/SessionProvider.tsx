
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
  const initializationTimeout = useRef<NodeJS.Timeout>();

  const refreshSession = async () => {
    if (!mounted.current) return;

    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        if (mounted.current) {
          await clearAuthData();
          setIsAuthenticated(false);
          navigate('/login');
          toast.error('Your session has expired. Please sign in again.');
        }
        return;
      }

      if (!newSession) {
        if (mounted.current && window.location.pathname !== '/login') {
          await clearAuthData();
          setIsAuthenticated(false);
          navigate('/login');
        }
        return;
      }

      if (mounted.current) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      if (mounted.current) {
        await clearAuthData();
        setIsAuthenticated(false);
        navigate('/login');
        toast.error('An error occurred with your session. Please sign in again.');
      }
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        if (!isMounted) return;

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
            setIsAuthenticated(false);
            navigate('/login');
          }
        } else {
          console.log('Initial session found');
          if (isMounted) {
            setIsAuthenticated(true);
            setIsLoading(false);
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (isMounted) {
          await clearAuthData();
          setIsAuthenticated(false);
          navigate('/login');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Initialize session check immediately
    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;
      
      console.log('Auth state changed:', event, 'Session:', !!currentSession);
      
      switch (event) {
        case 'SIGNED_IN':
          if (currentSession) {
            console.log('User signed in, setting authenticated state');
            setIsAuthenticated(true);
            setIsLoading(false);
            navigate('/dashboard');
          }
          break;
          
        case 'SIGNED_OUT':
          console.log('User signed out, clearing auth state');
          setIsAuthenticated(false);
          setIsLoading(false);
          await clearAuthData();
          navigate('/login');
          break;
          
        case 'TOKEN_REFRESHED':
          if (currentSession) {
            console.log('Token refreshed, maintaining authenticated state');
            setIsAuthenticated(true);
            setIsLoading(false);
          }
          break;
      }
    });

    return () => {
      isMounted = false;
      mounted.current = false;
      if (subscription) {
        subscription.unsubscribe();
      }
      if (initializationTimeout.current) {
        clearTimeout(initializationTimeout.current);
      }
    };
  }, [navigate, supabase]);

  useEffect(() => {
    // Set authentication state based on session
    if (session) {
      setIsAuthenticated(true);
      setIsLoading(false);
    }
  }, [session]);

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
