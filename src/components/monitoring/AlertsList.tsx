
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { AlertThreshold } from "@/types/monitoring";

interface AlertsListProps {
  alerts: AlertThreshold[];
}

export function AlertsList({ alerts }: AlertsListProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
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
  );
}
