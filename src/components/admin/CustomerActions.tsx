import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CustomerActionsProps {
  userId: string;
  totalSearches: number;
  onCustomerUpdate: () => void;
}

export const CustomerActions = ({ userId, totalSearches, onCustomerUpdate }: CustomerActionsProps) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateSearchVolume = async (newTotal: number) => {
    try {
      setIsUpdating(true);
      
      // Update the user's subscription with new total searches
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ total_searches: newTotal })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating search volume:', updateError);
        toast.error('Failed to update search volume');
        return;
      }

      toast.success('Search volume updated successfully');
      onCustomerUpdate(); // Refresh the table data
    } catch (error) {
      console.error('Error in handleUpdateSearchVolume:', error);
      toast.error('An error occurred while updating search volume');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      const { error: deleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (deleteError) {
        console.error('Error deleting user:', deleteError);
        toast.error('Failed to delete user');
        return;
      }

      toast.success('User deleted successfully');
      onCustomerUpdate(); // Refresh the table data
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      toast.error('An error occurred while deleting the user');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleUpdateSearchVolume(totalSearches + 10)}
        disabled={isUpdating}
      >
        +10 Searches
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleUpdateSearchVolume(totalSearches - 10)}
        disabled={isUpdating || totalSearches < 10}
      >
        -10 Searches
      </Button>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleDeleteUser}
      >
        Delete User
      </Button>
    </div>
  );
};