
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

  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      
      if (refreshedSession) {
        // Update session in Supabase table
        const { error: updateError } = await supabase
          .from('sessions')
          .upsert({
            user_id: refreshedSession.user.id,
            expires_at: new Date(refreshedSession.expires_at!),
            last_activity: new Date(),
            metadata: { userAgent: navigator.userAgent }
          });

        if (updateError) throw updateError;
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
        if (session?.user) {
          await refreshSession();
        }
      } finally {
        setIsLoading(false);
      }
    };

    setupSession();

    const cleanupInterval = setInterval(refreshSession, 10 * 60 * 1000); // Refresh every 10 minutes

    return () => clearInterval(cleanupInterval);
  }, [session?.user?.id]);

  // Subscribe to auth changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      } else if (event === 'SIGNED_IN') {
        await refreshSession();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
