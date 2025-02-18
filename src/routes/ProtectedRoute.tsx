
import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';
import { useSessionContext } from '@/providers/SessionProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, isAuthenticated } = useSessionContext();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !session) {
      console.log('No session found in ProtectedRoute, redirecting to login');
      navigate('/login', { replace: true });
    }
  }, [session, navigate, isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
