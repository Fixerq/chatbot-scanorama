import { useNavigate } from 'react-router-dom';
import { useSession } from '@supabase/auth-helpers-react';
import NavigationBar from '@/components/NavigationBar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { useCustomerData } from '@/hooks/useCustomerData';
import { CustomerTable } from '@/components/admin/CustomerTable';
import { CreateUserForm } from '@/components/admin/CreateUserForm';

const AdminConsole = () => {
  const navigate = useNavigate();
  const session = useSession();
  const { isAdmin, isChecking } = useAdminStatus();
  const { customers, isLoading, fetchCustomerData } = useCustomerData(session);

  if (!session) {
    navigate('/login');
    return null;
  }

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Verifying admin access...</span>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
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

          <TabsContent value="customers">
            <CustomerTable 
              customers={customers}
              onCustomerUpdate={fetchCustomerData}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="create">
            <CreateUserForm onUserCreated={fetchCustomerData} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminConsole;