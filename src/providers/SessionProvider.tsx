
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
  const mounted = useRef(true);
  const refreshTimeout = useRef<NodeJS.Timeout>();

  const refreshSession = async () => {
    if (!mounted.current) return;

    try {
      const { data: { session: newSession }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session refresh error:', error);
        if (mounted.current) {
          // Clear any stored auth data
          await supabase.auth.signOut();
          localStorage.clear(); // Clear all local storage
          navigate('/login');
          toast.error('Your session has expired. Please sign in again.');
        }
        return;
      }

      if (!newSession) {
        console.log('No active session');
        if (mounted.current && window.location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }

      // If we have a valid session, check its expiry
      const expiresAt = newSession.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        // If token expires in less than 5 minutes, refresh it
        if (expiresIn < 300) {
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error('Token refresh failed:', refreshError);
            if (mounted.current) {
              await supabase.auth.signOut();
              navigate('/login');
              toast.error('Unable to refresh your session. Please sign in again.');
            }
          }
        }
      }

      console.log('Session check completed successfully');
    } catch (error) {
      console.error('Unexpected error during session refresh:', error);
      if (mounted.current) {
        await supabase.auth.signOut();
        navigate('/login');
        toast.error('An error occurred with your session. Please sign in again.');
      }
    }
  };

  useEffect(() => {
    const setupSession = async () => {
      if (!mounted.current) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting initial session:', error);
          if (mounted.current) {
            await supabase.auth.signOut();
            navigate('/login');
          }
          return;
        }

        if (!session) {
          console.log('No initial session found');
          if (mounted.current && window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error during session setup:', error);
        if (mounted.current) {
          await supabase.auth.signOut();
          navigate('/login');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    setupSession();

    // Set up periodic session refresh
    refreshTimeout.current = setInterval(() => {
      if (session?.user && mounted.current) {
        refreshSession();
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        // Clear all auth-related storage
        localStorage.clear();
        if (mounted.current) {
          navigate('/login');
        }
      }
    });

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
      if (refreshTimeout.current) {
        clearInterval(refreshTimeout.current);
      }
    };
  }, [session?.user?.id]);

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
