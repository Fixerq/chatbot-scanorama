import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CustomerData } from '@/types/admin';
import { toast } from 'sonner';
import { Session } from '@supabase/auth-helpers-react';
import { Database } from '@/integrations/supabase/types';

export const useCustomerData = (session: Session | null) => {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCustomerData = async () => {
    if (!session) return;

    try {
      setIsLoading(true);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      if (profilesError) throw profilesError;

      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select('*');

      if (subscriptionsError) throw subscriptionsError;

      const { data: subscriptionLevels, error: levelsError } = await supabase
        .from('subscription_levels')
        .select('*');

      if (levelsError) throw levelsError;

      const levelsMap = new Map(
        subscriptionLevels?.map(level => [level.level, level.max_searches]) || []
      );

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const customersData: CustomerData[] = await Promise.all(
        (profilesData || []).map(async (profile) => {
          const subscription = subscriptionsData?.find(sub => sub.user_id === profile.id) || {
            id: '',
            user_id: profile.id,
            status: 'inactive',
            level: 'starter' as Database['public']['Enums']['subscription_level'],
            current_period_end: null,
            total_searches: 0
          };

          const { count: searchesUsed } = await supabase
            .from('analyzed_urls')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.id)
            .gte('created_at', startOfMonth.toISOString());

          const { data: emailData } = await supabase.functions.invoke('get-customer-email', {
            body: { userId: profile.id }
          });

          const totalSearches = subscription.total_searches || levelsMap.get(subscription.level || 'starter') || 0;
          const remaining = Math.max(0, totalSearches - (searchesUsed || 0));

          return {
            profile: {
              id: profile.id,
              created_at: profile.created_at,
              api_key: profile.api_key,
              first_name: profile.first_name,
              last_name: profile.last_name
            },
            subscription: {
              id: subscription.id,
              user_id: subscription.user_id,
              status: subscription.status,
              level: subscription.level,
              current_period_end: subscription.current_period_end,
              total_searches: subscription.total_searches
            },
            searchesRemaining: remaining,
            totalSearches,
            email: emailData?.email || profile.id
          };
        })
      );

      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load customer data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [session]);

  return { customers, isLoading, fetchCustomerData };
};