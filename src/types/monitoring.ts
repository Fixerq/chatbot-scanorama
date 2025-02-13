
export interface Metric {
  metric_name: string;
  metric_value: number;
}

export interface ErrorLog {
  unique_errors: string;
  time_bucket: string;
  error_count: number;
  affected_urls: string[];
}

export interface Provider {
  provider_name: string;
  detection_count: number;
  detection_rate: number;
  unique_sites: number;
}

export interface AlertThreshold {
  metric_name: string;
  current_value: number;
  threshold_value: number;
  alert_type: 'error' | 'warning' | 'info';
}

export interface Metrics {
  basic: Metric[];
  errors: ErrorLog[];
  providers: Provider[];
  alerts: AlertThreshold[];
}
