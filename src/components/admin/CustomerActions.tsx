import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface CustomerActionsProps {
  userId: string;
  totalSearches: number;
  onCustomerUpdate: () => void;
}

export const CustomerActions = ({ userId, totalSearches, onCustomerUpdate }: CustomerActionsProps) => {
  const handleUpdateSearchVolume = async (newTotal: number) => {
    try {
      // First, get the user's subscription to ensure it exists
      const { data: subscriptionData, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('id, level')
        .eq('user_id', userId)
        .single();

      if (subscriptionError) {
        console.error('Error fetching subscription:', subscriptionError);
        throw new Error('Failed to fetch subscription');
      }

      // Update the subscription level's max searches
      const { error: updateError } = await supabase
        .from('subscription_levels')
        .update({ max_searches: newTotal })
        .eq('level', subscriptionData.level)
        .select();

      if (updateError) {
        console.error('Error updating subscription level:', updateError);
        throw new Error('Failed to update subscription level');
      }

      toast.success('Search volume updated successfully');
      onCustomerUpdate();
    } catch (error) {
      console.error('Error updating search volume:', error);
      toast.error('Failed to update search volume');
    }
  };

  const handleDeleteUser = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) throw deleteError;

      toast.success('User deleted successfully');
      onCustomerUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-x-2">
      <Input
        type="number"
        defaultValue={totalSearches}
        className="w-24 inline-block mr-2"
        onBlur={(e) => {
          const newValue = parseInt(e.target.value);
          if (newValue !== totalSearches) {
            handleUpdateSearchVolume(newValue);
          }
        }}
      />
      <Button
        variant="destructive"
        size="icon"
        onClick={handleDeleteUser}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};