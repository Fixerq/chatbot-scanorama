import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

interface CreateUserFormProps {
  onUserCreated: () => void;
}

export const CreateUserForm = ({ onUserCreated }: CreateUserFormProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserSearches, setNewUserSearches] = useState('10');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userId = crypto.randomUUID();
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          { 
            id: userId,
            first_name: null,
            last_name: null,
            api_key: null
          }
        ] as Database['public']['Tables']['profiles']['Insert'][])
        .select()
        .single();

      if (profileError) throw profileError;

      if (profileData) {
        const { error: subscriptionError } = await supabase
          .from('subscriptions')
          .insert([
            {
              user_id: profileData.id,
              status: 'active',
              level: 'starter' as Database['public']['Enums']['subscription_level'],
              total_searches: parseInt(newUserSearches)
            }
          ] as Database['public']['Tables']['subscriptions']['Insert'][]);

        if (subscriptionError) throw subscriptionError;

        if (isAdmin) {
          const { error: adminError } = await supabase
            .from('admin_users')
            .insert([
              { user_id: profileData.id }
            ] as Database['public']['Tables']['admin_users']['Insert'][]);

          if (adminError) throw adminError;
        }
      }

      toast.success('User created successfully');
      setNewUserEmail('');
      setNewUserSearches('10');
      setIsAdmin(false);
      onUserCreated();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  return (
    <form onSubmit={handleCreateUser} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          Email Address
        </label>
        <Input
          id="email"
          type="email"
          value={newUserEmail}
          onChange={(e) => setNewUserEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="searches" className="block text-sm font-medium mb-1">
          Number of Searches
        </label>
        <Input
          id="searches"
          type="number"
          value={newUserSearches}
          onChange={(e) => setNewUserSearches(e.target.value)}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isAdmin"
          checked={isAdmin}
          onCheckedChange={(checked) => setIsAdmin(checked as boolean)}
        />
        <label
          htmlFor="isAdmin"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Make user an admin
        </label>
      </div>
      <Button type="submit">Create User</Button>
    </form>
  );
};