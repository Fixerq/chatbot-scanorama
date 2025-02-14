
import React from 'react';
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CustomerActionsProps {
  userId: string;
  totalSearches: number;
  onCustomerUpdate: () => void;
}

export const CustomerActions = ({ userId, totalSearches, onCustomerUpdate }: CustomerActionsProps) => {
  const handleResetSearches = async () => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({ total_searches: 0 })
        .eq('user_id', userId);

      if (error) {
        console.error('Error resetting searches:', error);
        toast.error('Failed to reset searches');
        return;
      }

      toast.success('Successfully reset searches');
      onCustomerUpdate();
    } catch (error) {
      console.error('Error in handleResetSearches:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleResetSearches}>
          Reset Searches
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

