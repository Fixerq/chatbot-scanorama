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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUpdateSearchVolume = async (newTotal: number) => {
    try {
      setIsUpdating(true);
      
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({ total_searches: newTotal })
        .eq('user_id', userId)
        .select('total_searches')
        .single();

      if (updateError) {
        console.error('Error updating search volume:', updateError);
        toast.error('Failed to update search volume');
        return;
      }

      if (!updatedSubscription) {
        toast.error('No subscription found for this user');
        return;
      }

      toast.success('Search volume updated successfully');
      onCustomerUpdate();
    } catch (error) {
      console.error('Error in handleUpdateSearchVolume:', error);
      toast.error('An error occurred while updating search volume');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsDeleting(true);

      // First, call the delete_user_data function to clean up all related data
      const { error: deleteDataError } = await supabase
        .rpc('delete_user_data', { user_id_param: userId });

      if (deleteDataError) {
        console.error('Error deleting user data:', deleteDataError);
        toast.error('Failed to delete user data');
        return;
      }

      toast.success('User deleted successfully');
      onCustomerUpdate(); // Refresh the table data
    } catch (error) {
      console.error('Error in handleDeleteUser:', error);
      toast.error('An error occurred while deleting the user');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleUpdateSearchVolume(totalSearches + 10)}
        disabled={isUpdating || isDeleting}
      >
        +10 Searches
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        onClick={() => handleUpdateSearchVolume(totalSearches - 10)}
        disabled={isUpdating || isDeleting || totalSearches < 10}
      >
        -10 Searches
      </Button>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleDeleteUser}
        disabled={isDeleting || isUpdating}
      >
        {isDeleting ? 'Deleting...' : 'Delete User'}
      </Button>
    </div>
  );
};