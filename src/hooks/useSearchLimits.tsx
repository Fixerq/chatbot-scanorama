import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSearchLimits = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSearchLimits = async () => {
    if (!session?.user?.id) {
      console.error('No user session found');
      setSearchesLeft(0);
      setIsLoading(false);
      return;
    }

    try {
      console.log('Fetching search limits for user:', session.user.id);

      // Get user's subscription level
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('level')
        .eq('user_id', session.user.id)
        .eq('status', 'active')
        .maybeSingle();

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        throw subscriptionError;
      }

      // Default to 'starter' if no active subscription found
      const userLevel = subscriptionData?.level ?? 'starter';
      console.log('User subscription level:', userLevel);

      // Get max searches for this level
      const { data: levelData, error: levelError } = await supabase
        .from('subscription_levels')
        .select('max_searches')
        .eq('level', userLevel)
        .single();

      if (levelError) {
        console.error('Error fetching subscription level:', levelError);
        throw levelError;
      }

      const maxSearches = levelData.max_searches;
      console.log('Max searches allowed:', maxSearches);

      // Get count of searches made this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count, error: countError } = await supabase
        .from('analyzed_urls')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', session.user.id)
        .gte('created_at', startOfMonth.toISOString());

      if (countError) {
        console.error('Error counting searches:', countError);
        throw countError;
      }

      const searchesUsed = count || 0;
      console.log('Searches used this month:', searchesUsed);
      
      const remaining = Math.max(0, maxSearches - searchesUsed);
      console.log('Calculated remaining searches:', remaining);
      
      setSearchesLeft(remaining);
    } catch (error) {
      console.error('Error fetching search limits:', error);
      toast.error('Could not fetch search limit information');
      setSearchesLeft(0); // Set to 0 on error to prevent unlimited searches
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (session?.user?.id) {
      fetchSearchLimits();
    }
  }, [session?.user?.id]);

  // Subscribe to changes in analyzed_urls table
  useEffect(() => {
    if (!session?.user?.id) return;

    console.log('Setting up real-time subscription for analyzed_urls');
    const channel = supabase
      .channel('analyzed_urls_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analyzed_urls',
          filter: `user_id=eq.${session.user.id}`
        },
        () => {
          console.log('Received analyzed_urls change, refetching limits');
          fetchSearchLimits();
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  return { 
    searchesLeft, 
    isLoading, 
    refetchLimits: fetchSearchLimits 
  };
};