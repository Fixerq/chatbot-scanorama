
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function verifyUser(authHeader: string | null): Promise<string> {
  console.log('Starting user verification');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('No authorization header');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Checking Supabase configuration:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey
    });

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Verifying JWT token');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Unauthorized');
    }

    console.log('User authenticated successfully:', user.id);
    return user.id;
  } catch (error) {
    console.error('Error in verifyUser:', error);
    throw error;
  }
}
