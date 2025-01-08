import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

const Success = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(true);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);
  const sessionId = searchParams.get('session_id');

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
            <CardTitle className="text-3xl font-bold glow-text bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Payment Successful!
            </CardTitle>
            <CardDescription className="text-muted-foreground text-lg">
              {customerEmail ? `Thank you for your purchase! Please complete your registration to get started.` : 'Thank you for your purchase!'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <Button
                onClick={() => navigate('/signup')}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                Complete Registration
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Success;