import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut, CreditCard, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const NavigationBar = () => {
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  const handleManageSubscription = () => {
    // Redirect to Stripe customer portal - this will be implemented later
    toast.info('Subscription management coming soon');
  };

  const handleRecentSearches = () => {
    // This will be implemented later to show recent searches
    toast.info('Recent searches coming soon');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="mr-4 flex">
          <a href="/dashboard" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Detectify
            </span>
          </a>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleRecentSearches}
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Recent Searches</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleManageSubscription}
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default NavigationBar;