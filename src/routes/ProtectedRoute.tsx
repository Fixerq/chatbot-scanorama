
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import { checkUserSession } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      if (session) {
        console.log("Session exists in hook, allowing access");
        setHasSession(true);
        setIsChecking(false);
        return;
      }

      // Double-check with direct API call if hook returns null
      console.log("No session in hook, checking directly");
      const directSession = await checkUserSession();
      
      if (directSession) {
        console.log("Direct session check successful");
        setHasSession(true);
      } else {
        console.log("No session found, redirecting to login");
        toast.error('Please log in to access this page');
        // Use replace to avoid building up history stack
        navigate('/login', { replace: true, state: { from: location.pathname } });
      }
      
      setIsChecking(false);
    };

    checkSession();
  }, [session, navigate, location]);

  if (isChecking) {
    // You could return a loading spinner here
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin h-8 w-8 border-4 border-cyan-500 rounded-full border-t-transparent"></div>
    </div>;
  }

  return hasSession ? <>{children}</> : null;
};
