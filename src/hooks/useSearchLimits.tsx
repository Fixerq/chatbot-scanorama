import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSearchLimits = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSearchLimits = async () => {
    if (!session?.user?.id) return;

    try {
      // Get user's subscription level
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('level')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        throw subscriptionError;
      }

      const userLevel = subscriptionData?.level || 'starter';

      // Get max searches for this level
      const { data: levelData, error: levelError } = await supabase
        .from('subscription_levels')
        .select('max_searches')
        .eq('level', userLevel)
        .maybeSingle();

      if (levelError) {
        console.error('Error fetching subscription level:', levelError);
        throw levelError;
      }

      // Get count of searches made this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: searchesUsed, error: countError } = await supabase
        .from('analyzed_urls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id) // Add user_id filter
        .gte('created_at', startOfMonth.toISOString());

      if (countError) {
        console.error('Error counting searches:', countError);
        throw countError;
      }

      const maxSearches = levelData?.max_searches || 10;
      const remaining = Math.max(0, maxSearches - (searchesUsed || 0));
      
      console.log('Search limits calculation:', {
        userLevel,
        maxSearches,
        searchesUsed,
        remaining,
        startOfMonth: startOfMonth.toISOString()
      });
      
      setSearchesLeft(remaining);
    } catch (error) {
      console.error('Error fetching search limits:', error);
      toast.error('Could not fetch search limit information');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchSearchLimits();
  }, [session]);

  // Subscribe to changes in analyzed_urls table
  useEffect(() => {
    if (!session?.user?.id) return;

    const channel = supabase
      .channel('analyzed_urls_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyzed_urls',
          filter: `user_id=eq.${session.user.id}` // Add filter for user's records
        },
        (payload) => {
          console.log('Received real-time update for analyzed_urls:', payload);
          fetchSearchLimits();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, session]);

  return { searchesLeft, isLoading, refetchLimits: fetchSearchLimits };
};