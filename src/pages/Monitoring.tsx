
import { Loader2 } from "lucide-react";
import { useMetrics } from "@/hooks/useMetrics";
import { MetricCard } from "@/components/monitoring/MetricCard";

export default function MonitoringPage() {
  const { metrics, loading } = useMetrics();

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
      
      {/* Basic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics?.basic?.map((metric) => (
          <MetricCard key={metric.metric_name} metric={metric} />
        ))}
      </div>
    </div>
  );
}
