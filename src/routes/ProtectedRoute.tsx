
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    // Add a small delay to prevent flash of unauthorized content
    const timer = setTimeout(() => {
      if (!session) {
        console.log('No session found, redirecting to login');
        navigate('/login');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [session, navigate]);

  if (!session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
