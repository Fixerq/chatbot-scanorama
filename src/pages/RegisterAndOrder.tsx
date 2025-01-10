import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import RegistrationForm from '@/components/auth/RegistrationForm';
import SubscriptionHandler from '@/components/subscription/SubscriptionHandler';
import { toast } from 'sonner';

const RegisterAndOrder = () => {
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegistrationSuccess = (email: string) => {
    setRegisteredEmail(email);
  };

  const handleSubscription = async () => {
    if (!registeredEmail) {
      toast.error('Please complete registration first');
      return;
    }
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        toast.error('Please sign in to continue');
        navigate('/login');
        return;
      }

      const { data: checkoutData, error: checkoutError } = await supabase.functions.invoke('create-checkout', {
        body: {
          email: registeredEmail,
          returnUrl: window.location.origin + '/success',
        }
      });

      if (checkoutError) throw checkoutError;

      if (checkoutData?.url) {
        window.location.href = checkoutData.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast.error(error.message || 'Failed to process subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 space-y-8">
      {!registeredEmail ? (
        <RegistrationForm 
          onSuccess={handleRegistrationSuccess}
          isLoading={loading}
        />
      ) : (
        <SubscriptionHandler
          onSubscribe={handleSubscription}
          isLoading={loading}
        />
      )}
    </div>
  );
};

export default RegisterAndOrder;