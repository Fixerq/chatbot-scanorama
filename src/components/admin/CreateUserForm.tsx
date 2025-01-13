import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

interface CreateUserFormProps {
  onUserCreated: () => void;
}

export const CreateUserForm = ({ onUserCreated }: CreateUserFormProps) => {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserSearches, setNewUserSearches] = useState('10');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          { id: crypto.randomUUID() }
        ])
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
              level: 'starter'
            }
          ]);

        if (subscriptionError) throw subscriptionError;
      }

      toast.success('User created successfully');
      setNewUserEmail('');
      setNewUserSearches('10');
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
      <Button type="submit">Create User</Button>
    </form>
  );
};