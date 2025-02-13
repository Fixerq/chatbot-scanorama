
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Provider } from "@/types/monitoring";

interface ProvidersListProps {
  providers: Provider[];
}

export function ProvidersList({ providers }: ProvidersListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Chatbot Providers</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {providers?.map((provider, index) => (
            <div key={index} className="border-b pb-4 last:border-0 last:pb-0">
              <p className="font-medium">{provider.provider_name}</p>
              <div className="text-sm text-muted-foreground mt-1">
                <p>Detected on {provider.unique_sites} unique sites</p>
                <p>Total detections: {provider.detection_count}</p>
                <p>Detection rate: {provider.detection_rate.toFixed(2)}%</p>
              </div>
            </div>
          ))}
          {(!providers || providers.length === 0) && (
            <p className="text-muted-foreground">No provider data available</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
