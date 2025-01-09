import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Crown } from "lucide-react";

const RegisterAndOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();
  const priceId = searchParams.get('priceId');
  const planName = searchParams.get('planName');

  useEffect(() => {
    if (session && priceId) {
      handleCheckout();
    }
  }, [session]);

  const handleCheckout = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          priceId,
          returnUrl: window.location.origin
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }
      
      if (data?.url) {
        console.log('Redirecting to checkout:', data.url);
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to create checkout session. Please try again.');
    }
  };

  if (!priceId || !planName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
        <Card className="w-full max-w-md border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Invalid Request
            </CardTitle>
            <CardDescription className="text-lg">
              Missing required product information. Please select a plan from our pricing page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const getPlanIcon = () => {
    if (planName.toLowerCase().includes('founder')) {
      return <Crown className="w-8 h-8 text-amber-500" />;
    }
    return <Check className="w-8 h-8 text-cyan-500" />;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-background/80 animate-fade-in">
      <div className="w-full max-w-xl">
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center">
              {getPlanIcon()}
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-sm">
                Selected Plan
              </Badge>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                {planName}
              </CardTitle>
            </div>
            <CardDescription className="text-lg text-muted-foreground">
              Create your account to continue
            </CardDescription>
            <Separator className="my-4" />
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <div className="rounded-lg">
              <Auth
                supabaseClient={supabase}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: 'rgb(6 182 212)',
                        brandAccent: 'rgb(8 145 178)',
                        brandButtonText: 'white',
                        defaultButtonBackground: 'rgb(15 23 42)',
                        defaultButtonBackgroundHover: 'rgb(30 41 59)',
                        inputBackground: 'rgb(15 23 42)',
                        inputBorder: 'rgb(51 65 85)',
                        inputBorderHover: 'rgb(71 85 105)',
                        inputBorderFocus: 'rgb(6 182 212)',
                      },
                    },
                  },
                  className: {
                    container: 'w-full',
                    button: 'w-full px-4 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg',
                    input: 'w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-200',
                    label: 'block text-sm font-medium text-muted-foreground mb-1.5',
                    loader: 'text-cyan-500',
                    message: 'text-sm text-red-500 mt-1',
                    anchor: 'text-cyan-500 hover:text-cyan-400 transition-colors duration-200',
                  },
                }}
                theme="dark"
                providers={[]}
                redirectTo={`${window.location.origin}/register-and-order?priceId=${priceId}&planName=${planName}`}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAndOrder;