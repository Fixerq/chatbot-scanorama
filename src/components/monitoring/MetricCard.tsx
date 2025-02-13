
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Metric } from "@/types/monitoring";

interface MetricCardProps {
  metric: Metric;
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <Card>
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
  );
}
