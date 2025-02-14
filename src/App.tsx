
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './providers/AuthProvider';
import { router } from './routes/routes';
import { useSession } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000,
    },
  },
});

interface AppRoute {
  path: string;
  element: React.ReactNode;
  authRedirect?: string;
}

const AppRoutes = () => {
  const session = useSession();

  return (
    <Routes>
      {router.routes.map((route) => {
        const typedRoute = route as unknown as AppRoute;
        return (
          <Route
            key={typedRoute.path}
            path={typedRoute.path}
            element={
              typedRoute.authRedirect && session ? (
                <Navigate to={typedRoute.authRedirect} replace />
              ) : (
                typedRoute.element
              )
            }
          />
        );
      })}
    </Routes>
  );
};

const App = () => {
  const [initialSession, setInitialSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setInitialSession(session);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider 
        supabaseClient={supabase}
        initialSession={initialSession}
      >
        <Router>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </AuthProvider>
        </Router>
      </SessionContextProvider>
    </QueryClientProvider>
  );
};

export default App;
