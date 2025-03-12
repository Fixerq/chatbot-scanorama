
import { useState, useEffect } from 'react';
import { useSupabaseClient, useSession } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

export const useSearchLimits = () => {
  const supabase = useSupabaseClient();
  const session = useSession();
  const [searchesLeft, setSearchesLeft] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUnlimited, setIsUnlimited] = useState(false);

  useEffect(() => {
    const fetchSearchLimits = async () => {
      if (!session?.user?.id) return;

      try {
        // Get user's subscription level
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('level')
          .eq('user_id', session.user.id)
          .maybeSingle();

        const userLevel = subscriptionData?.level || 'starter';

        // Check if user has the founders plan (unlimited searches)
        if (userLevel === 'founders') {
          setIsUnlimited(true);
          setSearchesLeft(-1); // -1 indicates unlimited
          setIsLoading(false);
          return;
        }

        // Get max searches for this level
        const { data: levelData } = await supabase
          .from('subscription_levels')
          .select('max_searches')
          .eq('level', userLevel)
          .maybeSingle();

        // Get count of searches made this month
        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const { count: searchesUsed } = await supabase
          .from('analyzed_urls')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', startOfMonth.toISOString());

        const maxSearches = levelData?.max_searches || 10;
        const remaining = Math.max(0, maxSearches - (searchesUsed || 0));
        
        setSearchesLeft(remaining);
        setIsUnlimited(false);
      } catch (error) {
        console.error('Error fetching search limits:', error);
        toast.error('Could not fetch search limit information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchLimits();
  }, [supabase, session]);

  return { searchesLeft, isLoading, isUnlimited };
};
