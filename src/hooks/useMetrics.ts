
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Metric {
  metric_name: string;
  metric_value: number;
}

interface Metrics {
  basic: Metric[];
}

export function useMetrics() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Get basic metrics
      const { data: basicMetrics, error: basicError } = await supabase
        .rpc('get_performance_metrics');

      if (basicError) throw basicError;

      setMetrics({
        basic: basicMetrics,
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { metrics, loading };
}
