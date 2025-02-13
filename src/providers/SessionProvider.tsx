
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

  const refreshSession = async () => {
    if (!isInitialized || !mounted.current) {
      console.log('Session not yet initialized, skipping refresh');
      return;
    }

    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession?.user) {
        console.log('No active session found during refresh');
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
        return;
      }

      // Only attempt refresh if session is close to expiring
      if (currentSession.expires_at && new Date(currentSession.expires_at * 1000) > new Date(Date.now() + 5 * 60 * 1000)) {
        console.log('Session still valid, no need to refresh');
        return;
      }

      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        console.error('Session refresh failed:', error);
        if (error.message.includes('Invalid Refresh Token') || 
            error.message.includes('refresh_token_not_found')) {
          console.log('Invalid refresh token, redirecting to login');
          await supabase.auth.signOut();
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
        return;
      }
      
      if (refreshedSession && mounted.current) {
        console.log('Session refreshed successfully');
        const { error: updateError } = await supabase
          .from('sessions')
          .upsert({
            user_id: refreshedSession.user.id,
            expires_at: new Date(refreshedSession.expires_at!),
            last_activity: new Date(),
            metadata: { userAgent: navigator.userAgent }
          });

        if (updateError) {
          console.error('Failed to update session:', updateError);
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      if (mounted.current) {
        await supabase.auth.signOut();
        if (window.location.pathname !== '/login') {
          navigate('/login');
        }
      }
    }
  };

  useEffect(() => {
    const setupSession = async () => {
      if (!mounted.current) return;
      
      try {
        setIsLoading(true);
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (!currentSession?.user) {
          console.log('No active session found');
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
          return;
        }

        console.log('Active session found:', currentSession.user.id);
        await refreshSession();
      } catch (error) {
        console.error('Error during session setup:', error);
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

    refreshTimeout.current = setInterval(() => {
      if (isInitialized && session?.user && mounted.current) {
        refreshSession();
      }
    }, 4 * 60 * 1000); // Refresh every 4 minutes

    return () => {
      mounted.current = false;
      if (refreshTimeout.current) {
        clearInterval(refreshTimeout.current);
      }
    };
  }, [session?.user?.id, isInitialized]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return;
      
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        navigate('/login');
      } else if (event === 'SIGNED_IN' && session) {
        console.log('User signed in');
        setIsInitialized(true);
        await refreshSession();
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

