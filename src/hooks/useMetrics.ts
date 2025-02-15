
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Metrics } from '@/types/monitoring';

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

      // Get monitoring alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('monitoring_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (alertsError) throw alertsError;

      // Get recent errors
      const { data: errors, error: errorsError } = await supabase
        .from('monitoring_errors')
        .select('*')
        .order('time_bucket', { ascending: false })
        .limit(5);
      if (errorsError) throw errorsError;

      // Get provider stats
      const { data: providers, error: providersError } = await supabase
        .from('monitoring_providers')
        .select('*')
        .order('detection_count', { ascending: false })
        .limit(5);
      if (providersError) throw providersError;

      setMetrics({
        basic: basicMetrics,
        alerts: alerts,
        errors: errors,
        providers: providers,
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
