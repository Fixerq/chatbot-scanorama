
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

  const waitForSession = async (userId: string, maxAttempts = 20): Promise<boolean> => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempting to get session (attempt ${attempt}/${maxAttempts})`);
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error(`Session error on attempt ${attempt}:`, sessionError);
          // Continue trying despite errors
          await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
          continue;
        }
        
        if (session?.user?.id === userId) {
          console.log('Session successfully established');
          return true;
        }
        
        console.log(`No valid session yet on attempt ${attempt}, waiting...`);
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5 second delay
      } catch (error) {
        console.error(`Error checking session on attempt ${attempt}:`, error);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    return false;
  };

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
            price_id: priceId // Include priceId in user metadata
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

      // Wait for session to be established with more attempts and longer delays
      const sessionEstablished = await waitForSession(signUpData.user.id);
      
      if (!sessionEstablished) {
        // Instead of throwing an error, try to proceed with a session refresh
        console.log('Attempting to refresh session...');
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError || !refreshData.session) {
          console.error('Session refresh failed:', refreshError);
          throw new Error('Failed to establish session. Please try logging in.');
        }
      }

      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Final session check failed:', sessionError);
        throw new Error('Failed to verify session after establishment');
      }

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
          total_searches: priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1' ? -1 : 25
        });

      if (subscriptionError) {
        console.error('Subscription creation error:', subscriptionError);
        throw subscriptionError;
      }

      // Send welcome email
      try {
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
        // Don't throw here, just notify
        toast.error('Welcome email could not be sent, but your account was created successfully');
      }

      toast.success('Registration successful! Redirecting to dashboard...');
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
          className="bg-slate-900 border-slate-700 text-white"
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
          className="bg-slate-900 border-slate-700 text-white"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button 
        type="submit" 
        className="w-full bg-cyan-500 hover:bg-cyan-600" 
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
