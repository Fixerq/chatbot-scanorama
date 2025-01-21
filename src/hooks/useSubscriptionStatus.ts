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
        console.log('Fetching subscription status for user:', session.user.id);
        
        // First get the user's subscription
        const { data: subscription, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('level, status, total_searches')
          .eq('user_id', session.user.id)
          .single();

        if (subscriptionError) {
          console.error('Subscription fetch error:', subscriptionError);
          throw subscriptionError;
        }

        if (!subscription) {
          console.log('No subscription found for user');
          setSubscriptionData({
            level: 'starter',
            status: 'inactive',
            searchesRemaining: 0
          });
          return;
        }

        console.log('Subscription data:', subscription);

        // Get count of searches made this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: searchesUsed, error: searchError } = await supabase
          .from('analyzed_urls')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id)
          .gte('created_at', startOfMonth.toISOString());

        if (searchError) {
          console.error('Search count error:', searchError);
          throw searchError;
        }

        console.log('Searches used this month:', searchesUsed);
        
        // Calculate remaining searches based on total_searches from subscription
        const totalSearches = subscription.total_searches;
        const remaining = totalSearches === -1 ? -1 : Math.max(0, totalSearches - (searchesUsed || 0));

        console.log('Searches remaining:', remaining);

        setSubscriptionData({
          level: subscription.level,
          status: subscription.status,
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