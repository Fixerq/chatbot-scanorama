import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SubscriptionManager from './SubscriptionManager';

const Header = () => {
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login');
      toast.success('Successfully logged out');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  return (
    <header className="flex justify-between items-center mb-8">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <SubscriptionManager />
        <Button 
          variant="destructive" 
          onClick={handleLogout}
        >
          Log Out
        </Button>
      </div>
    </header>
  );
};

export default Header;