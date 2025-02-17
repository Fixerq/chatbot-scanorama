
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

      // Check token expiry
      const expiresAt = newSession.expires_at;
      if (expiresAt) {
        const expiresIn = expiresAt - Math.floor(Date.now() / 1000);
        if (expiresIn < 300) { // Less than 5 minutes until expiry
          const { data, error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError || !data.session) {
            console.error('Token refresh failed:', refreshError);
            if (mounted.current) {
              await clearAuthData();
              navigate('/login');
              toast.error('Unable to refresh your session. Please sign in again.');
            }
          }
        }
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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error || !session) {
          if (mounted.current && window.location.pathname !== '/login') {
            await clearAuthData();
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Session initialization error:', error);
        if (mounted.current) {
          await clearAuthData();
          navigate('/login');
        }
      } finally {
        if (mounted.current) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        if (mounted.current) {
          await clearAuthData();
          navigate('/login');
        }
      } else if (event === 'SIGNED_IN' && currentSession) {
        // Refresh session immediately on sign in
        await refreshSession();
      }
    });

    // Set up periodic session refresh
    refreshTimeout.current = setInterval(refreshSession, 4 * 60 * 1000); // Every 4 minutes

    return () => {
      mounted.current = false;
      subscription?.unsubscribe();
      if (refreshTimeout.current) {
        clearInterval(refreshTimeout.current);
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

