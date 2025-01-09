import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { supabase } from '@/integrations/supabase/client';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from 'sonner';
import Login from '@/pages/Login';
import Signup from '@/pages/Signup';
import Success from '@/pages/Success';
import Index from '@/pages/Index';
import SalesPage from '@/pages/SalesPage';
import RegisterAndOrder from '@/pages/RegisterAndOrder';

const queryClient = new QueryClient();

// Protected Route wrapper component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  return session ? <>{children}</> : null;
};

const AppRoutes = () => {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
      
      if (event === 'SIGNED_OUT') {
        navigate('/login');
      }
    });

    // Handle refresh token errors
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' && !session) {
        console.log('Session expired or refresh token invalid');
        toast.error('Your session has expired. Please sign in again.');
        navigate('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <Routes>
      {/* Public routes */}
      <Route 
        path="/" 
        element={session ? <Navigate to="/dashboard" replace /> : <SalesPage />} 
      />
      <Route 
        path="/login" 
        element={session ? <Navigate to="/dashboard" replace /> : <Login />} 
      />
      <Route 
        path="/signup" 
        element={<Signup />} 
      />
      <Route 
        path="/success" 
        element={<Success />} 
      />
      <Route 
        path="/register-and-order" 
        element={<RegisterAndOrder />} 
      />
      
      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Index />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionContextProvider supabaseClient={supabase}>
        <Router>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </Router>
      </SessionContextProvider>
    </QueryClientProvider>
  );
};

export default App;