import { useState, useEffect } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSubscriptionStatus = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<{
    level: string;
    status: string;
    searchesRemaining: number;
  } | null>(null);
  const session = useSession();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        // Get user's subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('level, status')
          .eq('user_id', session.user.id)
          .single();

        if (subscriptionError) throw subscriptionError;

        // Get subscription level details
        const { data: levelData, error: levelError } = await supabase
          .from('subscription_levels')
          .select('max_searches')
          .eq('level', subscription?.level || 'starter')
          .single();

        if (levelError) throw levelError;

        // Get count of searches made this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: searchesUsed, error: searchError } = await supabase
          .from('analyzed_urls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (searchError) throw searchError;

        const maxSearches = levelData?.max_searches || 10;
        const remaining = Math.max(0, maxSearches - (searchesUsed || 0));

        setSubscriptionData({
          level: subscription?.level || 'starter',
          status: subscription?.status || 'inactive',
          searchesRemaining: remaining
        });
      } catch (error) {
        console.error('Error fetching subscription status:', error);
        toast.error('Failed to fetch subscription status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [session, supabase]);

  return { subscriptionData, isLoading };
};