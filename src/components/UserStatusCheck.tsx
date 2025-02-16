
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { useEffect, useState } from 'react';
import { Alert } from './ui/alert';
import { Loader2 } from 'lucide-react';

export const UserStatusCheck = () => {
  const session = useSession();
  const supabase = useSupabaseClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!session?.user?.id) {
        console.log('No user session found');
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .rpc('is_admin_direct_v2', { user_id: session.user.id });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsAdmin(false);
          return;
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error in admin check:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, supabase]);

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return (
    <div className="space-y-2">
      <Alert variant={isAdmin ? "destructive" : "default"}>
        User Role: {isAdmin ? 'Admin' : 'Regular User'}
      </Alert>
    </div>
  );
};
