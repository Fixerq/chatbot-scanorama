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
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
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

      if (!signUpData.user) {
        console.error('No user data returned from signup');
        throw new Error('Failed to create user account');
      }

      console.log('User signed up successfully:', signUpData.user.id);

      // Wait for session to be established (with retry)
      let session = null;
      let retryCount = 0;
      const maxRetries = 3;

      while (!session && retryCount < maxRetries) {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(`Session error (attempt ${retryCount + 1}):`, sessionError);
          retryCount++;
          if (retryCount === maxRetries) throw sessionError;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }

        session = sessionData.session;
        if (!session) {
          console.log(`No session yet (attempt ${retryCount + 1}), retrying...`);
          retryCount++;
          if (retryCount === maxRetries) throw new Error('Failed to establish session after signup');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!session?.user?.id) {
        console.error('No session or user ID after retries');
        throw new Error('Failed to establish session after signup');
      }

      console.log('Session established successfully:', session.user.id);

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

      // Create initial subscription record with Founders Plan settings
      const { error: subscriptionError } = await supabase
        .from('subscriptions')
        .upsert({
          user_id: session.user.id,
          level: priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1' ? 'founders' : 'starter',
          status: 'active',
          total_searches: priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1' ? -1 : 25 // -1 for unlimited searches
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        throw subscriptionError;
      }

      // Send welcome email (non-blocking)
      try {
        console.log('Attempting to send welcome email to:', email);
        await supabase.functions.invoke('send-welcome-email', {
          body: {
            email,
            firstName,
            lastName
          }
        });
        console.log('Welcome email sent successfully');
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't throw the error, just show a toast
        toast.error('Welcome email could not be sent, but your account was created successfully.');
      }

      toast.success('Registration successful! Please check your email.');
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