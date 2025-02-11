
import { createContext, useContext, useEffect, useState } from 'react';
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

  const refreshSession = async () => {
    if (!isInitialized) {
      console.log('Session not yet initialized, skipping refresh');
      return;
    }

    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (refreshedSession) {
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
          throw updateError;
        }
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      toast.error('Session expired. Please log in again.');
      navigate('/login');
    }
  };

  useEffect(() => {
    const setupSession = async () => {
      try {
        // Check if we have an active session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          console.log('Active session found:', currentSession.user.id);
          await refreshSession();
        } else {
          console.log('No active session found');
          if (window.location.pathname !== '/login') {
            navigate('/login');
          }
        }
      } catch (error) {
        console.error('Error during session setup:', error);
        toast.error('Failed to initialize session');
        navigate('/login');
      } finally {
        setIsInitialized(true);
        setIsLoading(false);
      }
    };

    setupSession();

    // Only start refresh interval after initialization
    let refreshInterval: NodeJS.Timeout;
    if (isInitialized && session?.user) {
      console.log('Starting session refresh interval');
      refreshInterval = setInterval(refreshSession, 10 * 60 * 1000); // Refresh every 10 minutes
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [session?.user?.id, isInitialized]);

  // Subscribe to auth changes
  useEffect(() => {
    console.log('Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        navigate('/login');
      } else if (event === 'SIGNED_IN' && isInitialized) {
        console.log('User signed in');
        await refreshSession();
      }
    });

    return () => {
      console.log('Cleaning up auth state change listener');
      subscription.unsubscribe();
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
