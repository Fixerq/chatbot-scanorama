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

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .single();

      if (adminError || !adminData) {
        toast.error('Unauthorized access');
        navigate('/dashboard');
        return;
      }
    };

    const fetchCustomerData = async () => {
      try {
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

    checkAdminStatus();
    fetchCustomerData();
  }, [navigate]);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <NavigationBar />
      <div className="container py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Console</h1>
        
        <Tabs defaultValue="customers" className="w-full">
          <TabsList>
            <TabsTrigger value="customers">Customers</TabsTrigger>
          </TabsList>

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