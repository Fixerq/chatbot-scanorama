import { Badge } from "@/components/ui/badge";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { Loader2 } from "lucide-react";

export const SubscriptionStatus = () => {
  const { subscriptionData, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  if (!subscriptionData) {
    return null;
  }

  const { level, searchesRemaining } = subscriptionData;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="capitalize">
        {level} Plan
      </Badge>
      <span className="text-sm text-muted-foreground">
        {searchesRemaining === -1 ? '∞ searches' : `${searchesRemaining} searches remaining`}
      </span>
    </div>
  );
};