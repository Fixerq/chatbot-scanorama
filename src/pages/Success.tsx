import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Crown, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { SubscriptionStatus } from '@/components/SubscriptionStatus';

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

  // Clear any existing sessions on component mount
  useEffect(() => {
    const clearExistingSessions = async () => {
      // First clear storage, then sign out
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-')) {
          localStorage.removeItem(key);
        }
      }
      for (const key of Object.keys(sessionStorage)) {
        if (key.startsWith('sb-')) {
          sessionStorage.removeItem(key);
        }
      }
      await supabase.auth.signOut();
    };

    clearExistingSessions();
  }, [supabase.auth]);

  useEffect(() => {
    const getCustomerEmail = async () => {
      if (!sessionId) {
        navigate('/');
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke('get-customer-email', {
          body: { sessionId }
        });

        if (error) throw error;
        if (data?.email) {
          setCustomerEmail(data.email);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching customer email:', error);
        toast.error('Failed to fetch customer information');
        navigate('/');
      }
    };

    getCustomerEmail();
  }, [sessionId, navigate, supabase.functions]);

  const handleLoginClick = () => {
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-md">
        <Card className="card-gradient border-none shadow-xl">
          <CardHeader className="space-y-2 text-center pb-6">
            <div className="flex justify-center mb-4">
              <Crown className="h-12 w-12 text-amber-500" />
            </div>
            <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Welcome to Detectify!
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              {customerEmail ? `Thank you for joining us, ${customerEmail}!` : 'Thank you for your purchase!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-800/50 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Your Subscription</h3>
              <SubscriptionStatus />
            </div>
            <div className="text-center">
              <Button
                onClick={handleLoginClick}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Login to Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Success;