
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Metrics, AlertThreshold } from '@/types/monitoring';

// Type guard to validate alert type
function isValidAlertType(type: string): type is AlertThreshold['alert_type'] {
  return ['error', 'warning', 'info'].includes(type);
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

      // Get recent errors
      const { data: errors, error: errorsError } = await supabase
        .from('error_monitoring')
        .select('*')
        .limit(5);

      if (errorsError) throw errorsError;

      // Get provider stats
      const { data: providers, error: providersError } = await supabase
        .from('provider_analysis')
        .select('*')
        .order('detection_count', { ascending: false })
        .limit(10);

      if (providersError) throw providersError;

      // Get active alerts and validate types
      const { data: alertsData, error: alertsError } = await supabase
        .rpc('check_alert_thresholds');

      if (alertsError) throw alertsError;

      // Validate and transform alerts
      const validatedAlerts: AlertThreshold[] = (alertsData || []).map(alert => ({
        ...alert,
        alert_type: isValidAlertType(alert.alert_type) ? alert.alert_type : 'error'
      }));

      setMetrics({
        basic: basicMetrics,
        errors,
        providers,
        alerts: validatedAlerts
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
