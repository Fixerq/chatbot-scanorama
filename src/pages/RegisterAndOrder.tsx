import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import RegistrationForm from '@/components/auth/RegistrationForm';
import SubscriptionHandler from '@/components/subscription/SubscriptionHandler';

const RegisterAndOrder = () => {
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleRegistrationSuccess = (email: string) => {
    setRegisteredEmail(email);
  };

  const handleSubscription = async () => {
    if (!registeredEmail) return;
    
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('No authenticated user found');
      }

      const response = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email: registeredEmail,
          returnUrl: window.location.origin + '/success',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      throw error;
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