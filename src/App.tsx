import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from './providers/AuthProvider';
import { routes } from './routes/routes';
import { useSession } from '@supabase/auth-helpers-react';

const queryClient = new QueryClient();

const AppRoutes = () => {
  const session = useSession();

  return (
    <Routes>
      {routes.map((route) => (
        <Route
          key={route.path}
          path={route.path}
          element={
            route.authRedirect && session ? (
              <Navigate to={route.authRedirect} replace />
            ) : (
              route.element
            )
          }
        />
      ))}
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
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