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
      if (!session?.user?.id) return;

      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .single();

        if (error) {
          console.error('Error checking admin status:', error);
          return;
        }

        setIsAdmin(!!data);
      } catch (error) {
        console.error('Error in admin check:', error);
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