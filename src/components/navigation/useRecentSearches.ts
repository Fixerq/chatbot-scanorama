import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from 'sonner';

interface RecentSearch {
  id: number;
  url: string;
  status: string;
  created_at: string;
  details: {
    title?: string;
    description?: string;
  } | null;
}

export const useRecentSearches = () => {
  const supabase = useSupabaseClient();
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchRecentSearches = async () => {
      try {
        setIsLoading(true);
        const { data: searches, error } = await supabase
          .from('analyzed_urls')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Error fetching recent searches:', error);
          throw error;
        }

        setRecentSearches(searches as RecentSearch[]);
      } catch (error) {
        console.error('Error accessing recent searches:', error);
        toast.error('Could not load recent searches. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecentSearches();
  }, [supabase]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (status.toLowerCase().includes('success')) return 'success';
    return 'secondary';
  };

  return {
    recentSearches,
    isLoading,
    formatDate,
    getStatusBadgeColor,
  };
};