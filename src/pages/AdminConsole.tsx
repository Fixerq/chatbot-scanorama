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

const AdminConsole = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
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

    const fetchData = async () => {
      try {
        // Fetch users
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        if (userError) throw userError;

        // Fetch subscriptions
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*');
        if (subscriptionError) throw subscriptionError;

        setUsers(userData.users);
        setSubscriptions(subscriptionData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load admin data');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();
    fetchData();
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
        
        <Tabs defaultValue="users" className="w-full">
          <TabsList>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{formatDate(user.created_at)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">Active</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="subscriptions">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User ID</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Expiry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.user_id}</TableCell>
                      <TableCell className="capitalize">{sub.level}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={sub.status === 'active' ? 'default' : 'secondary'}
                        >
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.current_period_end 
                          ? formatDate(sub.current_period_end)
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