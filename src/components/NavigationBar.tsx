import { useNavigate } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { LogOut, CreditCard, Search, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface RecentSearch {
  id: number;
  url: string;
  status: string;
  created_at: string;
  details: {
    title?: string;
    description?: string;
  } | null;
}

const NavigationBar = () => {
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [isSearchesOpen, setIsSearchesOpen] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);

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

  const handleManageSubscription = async () => {
    try {
      setIsSubscriptionLoading(true);
      console.log('Creating checkout session...');
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: 'price_1QeakhEiWhAkWDnr2yad4geJ' } // Pro plan price ID
      });

      if (error) throw error;
      
      if (data?.url) {
        console.log('Redirecting to checkout:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout process. Please try again.");
    } finally {
      setIsSubscriptionLoading(false);
    }
  };

  const handleRecentSearches = async () => {
    try {
      setIsLoading(true);
      const { data: searches, error } = await supabase
        .from('analyzed_urls')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching recent searches:', error);
        throw error;
      }

      setRecentSearches(searches as RecentSearch[]);
      setIsSearchesOpen(true);
    } catch (error) {
      console.error('Error accessing recent searches:', error);
      toast.error('Could not load recent searches. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadgeColor = (status: string) => {
    if (status.toLowerCase().includes('error')) return 'destructive';
    if (status.toLowerCase().includes('success')) return 'success';
    return 'secondary';
  };

  return (
    <>
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
              disabled={isLoading}
            >
              <Search className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isLoading ? 'Loading...' : 'Recent Searches'}
              </span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-2"
              onClick={handleManageSubscription}
              disabled={isSubscriptionLoading}
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">
                {isSubscriptionLoading ? 'Loading...' : 'Subscription'}
              </span>
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

      <Dialog open={isSearchesOpen} onOpenChange={setIsSearchesOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Recent Searches</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {recentSearches.map((search) => (
                <div
                  key={search.id}
                  className="rounded-lg border p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">
                        {search.details?.title || search.url}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {search.details?.description || 'No description available'}
                      </p>
                    </div>
                    <a
                      href={search.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <Badge variant={getStatusBadgeColor(search.status)}>
                      {search.status}
                    </Badge>
                    <span>{formatDate(search.created_at)}</span>
                  </div>
                </div>
              ))}
              {recentSearches.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  No recent searches found
                </p>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NavigationBar;