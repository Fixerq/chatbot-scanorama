
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

  const { level, searchesRemaining, status } = subscriptionData;

  // Don't show anything for inactive subscriptions
  if (status !== 'active') {
    return null;
  }

  // Format the badge text
  const badgeText = level === 'founders' 
    ? 'Founders' 
    : `${level.charAt(0).toUpperCase() + level.slice(1)} Plan`;

  // Format the searches text
  const searchesText = searchesRemaining === -1 
    ? '∞ searches' 
    : `${searchesRemaining} searches remaining`;

  return (
    <div className="flex items-center gap-2">
      <Badge 
        variant={level === 'founders' ? 'default' : 'secondary'} 
        className="capitalize"
      >
        {badgeText}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {searchesText}
      </span>
    </div>
  );
};
