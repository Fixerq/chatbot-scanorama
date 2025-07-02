
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
        setIsLoading(false);
        return;
      }

      console.log('Checking admin status for user:', session.user.id);

      try {
        // Use the secure admin check function instead of direct query
        const { data, error } = await supabase
          .rpc('is_admin', { user_id: session.user.id });

        if (error) {
          console.error('Error checking admin status:', error);
          setIsLoading(false);
          return;
        }

        console.log('Admin check result:', data ? 'Is Admin' : 'Regular User');
        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error in admin check:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [session, supabase]);

  // We're still performing the admin check in the background,
  // but we're not showing anything to the user anymore
  return null;
}
