import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { NameFields } from './NameFields';

interface RegistrationFormProps {
  supabase: any;
  firstName: string;
  lastName: string;
  setFirstName: (value: string) => void;
  setLastName: (value: string) => void;
  priceId?: string;
  customerEmail?: string | null;
}

export const RegistrationForm = ({
  supabase,
  firstName,
  lastName,
  setFirstName,
  setLastName,
  priceId,
  customerEmail,
}: RegistrationFormProps) => {
  const [email, setEmail] = useState(customerEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log('Starting registration process...');

      // Sign up the user
      const { data: { session }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        console.error('Sign up error:', signUpError);
        throw signUpError;
      }

      if (!session?.user?.id) {
        throw new Error('No session or user ID after signup');
      }

      console.log('User signed up successfully:', session.user.id);

      // Create or update customer record
      const { error: customerError } = await supabase
        .from('customers')
        .upsert({
          user_id: session.user.id,
          email: email,
          first_name: firstName,
          last_name: lastName,
          price_id: priceId || null,
        });

      if (customerError) {
        console.error('Customer update error:', customerError);
        throw customerError;
      }

      // Create initial subscription record
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: session.user.id,
          level: 'starter',
          status: 'active',
          total_searches: 25
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        throw subscriptionError;
      }

      // If priceId is provided, update subscription level
      if (priceId) {
        console.log('Updating subscription for price ID:', priceId);
        let subscriptionLevel = 'pro';
        let totalSearches = 100;

        if (priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1') {
          subscriptionLevel = 'pro';
          totalSearches = 100;
        } else if (priceId === 'price_1QfP20EiWhAkWDnrDhllA5a2') {
          subscriptionLevel = 'business';
          totalSearches = 500;
        }

        const { error: subscriptionUpdateError } = await supabase
          .from('subscriptions')
          .update({
            level: subscriptionLevel,
            status: 'active',
            total_searches: totalSearches
          })
          .eq('user_id', session.user.id);

        if (subscriptionUpdateError) {
          console.error('Subscription update error:', subscriptionUpdateError);
          throw subscriptionUpdateError;
        }
      }

      // Send welcome email
      console.log('Attempting to send welcome email to:', email);
      const { error: emailError } = await supabase.functions.invoke('send-welcome-email', {
        body: {
          email,
          firstName,
          lastName
        }
      });

      if (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't throw the error, just show a toast
        toast.error('Welcome email could not be sent, but your account was created successfully.');
      } else {
        console.log('Welcome email sent successfully');
        toast.success('Registration successful! Please check your email.');
      }

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'An error occurred during registration');
      toast.error('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <NameFields
        firstName={firstName}
        lastName={lastName}
        setFirstName={setFirstName}
        setLastName={setLastName}
      />

      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading || !!customerEmail}
        />
      </div>

      <div className="space-y-2">
        <Input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating your account...
          </>
        ) : (
          'Create Account'
        )}
      </Button>
    </form>
  );
};