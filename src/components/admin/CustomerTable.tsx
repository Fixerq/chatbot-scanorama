import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { CustomerData } from '@/types/admin';

interface CustomerTableProps {
  customers: CustomerData[];
  onCustomerUpdate: () => void;
  isLoading: boolean;
}

export const CustomerTable = ({ customers, onCustomerUpdate, isLoading }: CustomerTableProps) => {
  const handleUpdateSearchVolume = async (userId: string, newTotal: number) => {
    try {
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('level')
        .eq('user_id', userId)
        .single();

      if (!currentSub?.level) {
        throw new Error('No subscription level found');
      }

      const { data: subscriptionLevel, error: levelError } = await supabase
        .from('subscription_levels')
        .update({ max_searches: newTotal })
        .eq('level', currentSub.level)
        .select()
        .single();

      if (levelError) {
        console.error('Error updating subscription level:', levelError);
        throw new Error('Failed to update subscription level');
      }

      toast.success('Search volume updated successfully');
      onCustomerUpdate();
    } catch (error) {
      console.error('Error updating search volume:', error);
      toast.error('Failed to update search volume');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customer data...</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Searches</TableHead>
            <TableHead>Subscription End</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.profile.id}>
              <TableCell>{customer.email}</TableCell>
              <TableCell className="capitalize">{customer.subscription.level || 'starter'}</TableCell>
              <TableCell>
                <Badge 
                  variant={customer.subscription.status === 'active' ? 'default' : 'secondary'}
                >
                  {customer.subscription.status}
                </Badge>
              </TableCell>
              <TableCell>
                {customer.searchesRemaining} / {customer.totalSearches}
              </TableCell>
              <TableCell>
                {customer.subscription.current_period_end 
                  ? formatDate(customer.subscription.current_period_end)
                  : 'N/A'}
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  defaultValue={customer.totalSearches}
                  className="w-24 inline-block mr-2"
                  onBlur={(e) => {
                    const newValue = parseInt(e.target.value);
                    if (newValue !== customer.totalSearches) {
                      handleUpdateSearchVolume(customer.profile.id, newValue);
                    }
                  }}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};