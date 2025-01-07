import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { toast } from "sonner";

const SubscriptionManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = useSupabaseClient();

  const handleManageSubscription = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('No user found');

      const { data, error } = await supabase.functions.invoke('manage-subscription', {
        body: { customerId: user.id }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to open subscription management. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleManageSubscription}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : 'Manage Subscription'}
    </Button>
  );
};

export default SubscriptionManager;