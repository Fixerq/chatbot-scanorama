import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { Crown } from "lucide-react";

const RegisterAndOrder = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const session = useSession();
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  const priceId = searchParams.get('priceId');
  const planName = searchParams.get('planName');

  useEffect(() => {
    // Check if this is a redirect back from email verification
    const handleEmailVerification = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        console.log('Email verified, proceeding with checkout...');
        if (priceId) {
          await handleCheckout();
        }
      }
    };

    handleEmailVerification();
  }, []);

  useEffect(() => {
    if (session?.access_token && priceId) {
      handleCheckout();
    }
  }, [session?.access_token]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);
      
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email);
          
          if (session?.user?.id && (firstName || lastName)) {
            try {
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ 
                  first_name: firstName || null, 
                  last_name: lastName || null 
                })
                .eq('id', session.user.id);

              if (updateError) {
                console.error('Error updating profile:', updateError);
                toast({
                  title: "Error",
                  description: "Failed to update profile information",
                  variant: "destructive",
                });
              } else {
                console.log('Profile updated successfully');
              }
            } catch (error) {
              console.error('Error in profile update:', error);
              toast({
                title: "Error",
                description: "Failed to update profile information",
                variant: "destructive",
              });
            }
          }
          console.log('Waiting for email verification...');
          break;

        case 'SIGNED_OUT':
          // Check URL hash for email confirmation error
          const errorMessage = window.location.hash;
          if (errorMessage.includes('error=email_confirmation')) {
            toast({
              title: "Email Rate Limit",
              description: "Too many confirmation emails sent. Please wait a few minutes before trying again.",
              variant: "destructive",
            });
          }
          break;

        case 'USER_UPDATED':
        case 'TOKEN_REFRESHED':
        case 'PASSWORD_RECOVERY':
          // Handle other auth events if needed
          console.log('Auth event handled:', event);
          break;

        default:
          console.log('Unhandled auth event:', event);
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [firstName, lastName, priceId, session?.user?.id]);

  const handleCheckout = async () => {
    if (!session?.access_token) {
      console.error('No access token available');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating checkout session for price:', priceId);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: { 
          priceId,
          returnUrl: `${window.location.origin}/success`,
          customerName: `${firstName} ${lastName}`.trim()
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }
      
      if (!data?.url) {
        throw new Error('No checkout URL received');
      }

      console.log('Redirecting to checkout:', data.url);
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to process subscription. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-xl">
        <Card className="border-none shadow-xl bg-gradient-to-br from-card to-card/90">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center">
              {planName?.toLowerCase().includes('founder') ? (
                <Crown className="w-8 h-8 text-amber-500" />
              ) : null}
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              Complete Registration
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground">
              You selected the {planName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-6 pb-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="John"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Doe"
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>
            <div className="rounded-lg">
              <Auth
                supabaseClient={supabase}
                view="sign_up"
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
                        inputText: 'white',
                      },
                    },
                  },
                  style: {
                    input: {
                      color: 'white',
                    },
                  },
                }}
                providers={[]}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterAndOrder;