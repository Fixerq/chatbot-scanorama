import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import NavigationBar from '@/components/NavigationBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User } from '@supabase/supabase-js';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface Subscription {
  id: string;
  user_id: string;
  status: string;
  level: string;
  current_period_end: string | null;
}

interface CustomerData {
  user: User;
  subscription: Subscription;
  searchesRemaining: number;
  totalSearches: number;
}

const AdminConsole = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminChecking, setIsAdminChecking] = useState(true);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserSearches, setNewUserSearches] = useState('10');

  useEffect(() => {
    const checkAdminStatus = async () => {
      try {
        setIsAdminChecking(true);
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('user_id')
          .single();

        if (adminError || !adminData) {
          console.error('Admin check error:', adminError);
          toast.error('You do not have admin access');
          navigate('/dashboard');
          return false;
        }
        return true;
      } catch (error) {
        console.error('Admin check error:', error);
        toast.error('Failed to verify admin status');
        navigate('/dashboard');
        return false;
      } finally {
        setIsAdminChecking(false);
      }
    };

    const fetchCustomerData = async () => {
      try {
        const isAdmin = await checkAdminStatus();
        if (!isAdmin) return;

        // Fetch users
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;

        // Fetch subscriptions and search data for each user
        const customersData: CustomerData[] = await Promise.all(
          userData.users.map(async (user) => {
            // Get subscription data
            const { data: subscriptionData } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();

            // Get subscription level details
            const { data: levelData } = await supabase
              .from('subscription_levels')
              .select('max_searches')
              .eq('level', subscriptionData?.level || 'starter')
              .maybeSingle();

            // Get searches used this month
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);

            const { count: searchesUsed } = await supabase
              .from('analyzed_urls')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .gte('created_at', startOfMonth.toISOString());

            const totalSearches = levelData?.max_searches || 0;
            const remaining = Math.max(0, totalSearches - (searchesUsed || 0));

            return {
              user,
              subscription: subscriptionData || {
                id: '',
                user_id: user.id,
                status: 'inactive',
                level: 'starter',
                current_period_end: null
              },
              searchesRemaining: remaining,
              totalSearches
            };
          })
        );

        setCustomers(customersData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load customer data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCustomerData();
  }, [navigate]);

  const handleUpdateSearchVolume = async (userId: string, newTotal: number) => {
    try {
      // Get current subscription level
      const { data: currentSub } = await supabase
        .from('subscriptions')
        .select('level')
        .eq('user_id', userId)
        .single();

      // Update the subscription_levels table for this level
      await supabase
        .from('subscription_levels')
        .upsert({
          level: currentSub?.level || 'starter',
          max_searches: newTotal,
          features: []
        });

      toast.success('Search volume updated successfully');
      
      // Refresh the customer data
      window.location.reload();
    } catch (error) {
      console.error('Error updating search volume:', error);
      toast.error('Failed to update search volume');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create user in auth
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: newUserEmail,
        email_confirm: true,
        password: Math.random().toString(36).slice(-8), // Generate random password
      });

      if (userError) throw userError;

      // Update their search volume
      if (userData.user) {
        await handleUpdateSearchVolume(userData.user.id, parseInt(newUserSearches));
      }

      toast.success('User created successfully');
      setNewUserEmail('');
      setNewUserSearches('10');
      
      // Refresh the customer data
      window.location.reload();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user');
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (isAdminChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying admin access...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading customer data...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Console</h1>
        
        <Tabs defaultValue="customers" className="w-full">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
            <TabsTrigger value="create">Create User</TabsTrigger>
          </TabsList>

          <TabsContent value="create">
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
          </TabsContent>

          <TabsContent value="customers">
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
                    <TableRow key={customer.user.id}>
                      <TableCell>{customer.user.email}</TableCell>
                      <TableCell className="capitalize">{customer.subscription.level}</TableCell>
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
                              handleUpdateSearchVolume(customer.user.id, newValue);
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminConsole;
