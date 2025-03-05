
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
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

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
