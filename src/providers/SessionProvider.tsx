
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

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
  const [isInitialized, setIsInitialized] = useState(false);
  const mounted = useRef(true);
  const refreshTimeout = useRef<NodeJS.Timeout>();
  const authStateSubscription = useRef<{ data: { subscription: { unsubscribe: () => void } } }>();

  // Get the Supabase URL from environment variable
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const authTokenKey = `sb-${supabaseUrl?.split('//')[1]}-auth-token`;

  const refreshSession = async () => {
    if (!isInitialized || !mounted.current) {
      console.log('Session not yet initialized, skipping refresh');
      return;
    }

    try {
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        throw sessionError;
      }

      if (!currentSession) {
        console.log('No active session found');
        localStorage.removeItem(authTokenKey);
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }

      // Check if we need to refresh
      const tokenExpiryTime = new Date((currentSession.expires_at || 0) * 1000);
      const timeUntilExpiry = tokenExpiryTime.getTime() - Date.now();
      
      if (timeUntilExpiry > 5 * 60 * 1000) {
        console.log('Session still valid, no need to refresh');
        return;
      }

      console.log('Attempting to refresh session');
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        localStorage.removeItem(authTokenKey);
        await supabase.auth.signOut();
        if (window.location.pathname !== '/login') {
          navigate('/login');
          toast.error('Your session has expired. Please sign in again.');
        }
        return;
      }

      if (refreshData.session) {
        console.log('Session refreshed successfully');
      }

    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
      if (mounted.current) {
        localStorage.removeItem(authTokenKey);
        await supabase.auth.signOut();
        if (window.location.pathname !== '/login') {
          navigate('/login');
          toast.error('An error occurred with your session. Please sign in again.');
        }
      }
    }
  };

  useEffect(() => {
    const setupSession = async () => {
      if (!mounted.current) return;
      
      try {
        const { data: { session: initialSession }, error: initialError } = await supabase.auth.getSession();
        
        if (initialError) {
          console.error('Error getting initial session:', initialError);
          throw initialError;
        }

        if (!initialSession) {
          console.log('No initial session found');
          localStorage.removeItem(authTokenKey);
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        } else {
          console.log('Initial session found:', initialSession.user.id);
        }
      } catch (error) {
        console.error('Error during session setup:', error);
        localStorage.removeItem(authTokenKey);
        if (mounted.current && window.location.pathname !== '/login') {
          navigate('/login');
        }
      } finally {
        if (mounted.current) {
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    };

    setupSession();

    // Set up periodic session refresh
    refreshTimeout.current = setInterval(() => {
      if (isInitialized && session?.user && mounted.current) {
        refreshSession();
      }
    }, 4 * 60 * 1000); // Check every 4 minutes

    return () => {
      mounted.current = false;
      if (refreshTimeout.current) {
        clearInterval(refreshTimeout.current);
      }
    };
  }, [session?.user?.id, isInitialized]);

  useEffect(() => {
    if (!mounted.current) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        localStorage.removeItem(authTokenKey);
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('User signed in');
        setIsInitialized(true);
      } else if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    });

    authStateSubscription.current = { data: { subscription } };

    return () => {
      if (authStateSubscription.current?.data.subscription) {
        authStateSubscription.current.data.subscription.unsubscribe();
      }
    };
  }, [isInitialized]);

  return (
    <SessionContext.Provider value={{
      isLoading,
      isAuthenticated: !!session?.user && isInitialized,
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

