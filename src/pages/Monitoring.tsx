
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, AlertTriangle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Metric {
  metric_name: string;
  metric_value: number;
}

interface ErrorLog {
  unique_errors: string;
  time_bucket: string;
  error_count: number;
  affected_urls: string[];
}

interface Provider {
  provider_name: string;
  detection_count: number;
  detection_rate: number;
  unique_sites: number;
}

interface AlertThreshold {
  metric_name: string;
  current_value: number;
  threshold_value: number;
  alert_type: 'error' | 'warning' | 'info';
}

interface Metrics {
  basic: Metric[];
  errors: ErrorLog[];
  providers: Provider[];
  alerts: AlertThreshold[];
}

// Type guard to validate alert type
function isValidAlertType(type: string): type is AlertThreshold['alert_type'] {
  return ['error', 'warning', 'info'].includes(type);
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    // Refresh every 5 minutes
    const interval = setInterval(fetchMetrics, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  async function fetchMetrics() {
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
        alert_type: isValidAlertType(alert.alert_type) ? alert.alert_type : 'error' // Default to 'error' if invalid
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
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold">System Monitoring</h1>
      
      {/* Active Alerts */}
      {metrics?.alerts && metrics.alerts.length > 0 && (
        <div className="space-y-4">
          {metrics.alerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={alert.alert_type === 'error' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle className="ml-2">
                {alert.metric_name} Alert
              </AlertTitle>
              <AlertDescription className="ml-2">
                Current value: {alert.current_value}% (Threshold: {alert.threshold_value}%)
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
      
      {/* Basic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.basic?.map((metric) => (
          <Card key={metric.metric_name}>
            <CardHeader className="space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {metric.metric_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metric.metric_name.toLowerCase().includes('rate') 
                  ? `${metric.metric_value}%` 
                  : metric.metric_value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.errors?.map((error, index) => (
              <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="text-red-500 font-medium">{error.unique_errors}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Occurred at {new Date(error.time_bucket).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">
                  Affected {error.affected_urls?.length || 0} URLs
                </p>
              </div>
            ))}
            {(!metrics?.errors || metrics.errors.length === 0) && (
              <p className="text-muted-foreground">No recent errors</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Popular Chatbot Providers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics?.providers?.map((provider, index) => (
              <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
                <p className="font-medium">{provider.provider_name}</p>
                <div className="text-sm text-muted-foreground mt-1">
                  <p>Detected on {provider.unique_sites} unique sites</p>
                  <p>Total detections: {provider.detection_count}</p>
                  <p>Detection rate: {provider.detection_rate.toFixed(2)}%</p>
                </div>
              </div>
            ))}
            {(!metrics?.providers || metrics.providers.length === 0) && (
              <p className="text-muted-foreground">No provider data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
