
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function verifyUser(authHeader: string | null): Promise<string> {
  console.log('Starting user verification');
  
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('No authorization header');
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    console.log('Checking Supabase configuration:', {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey
    });

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing Supabase configuration');
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false }
    });

    console.log('Supabase client created, verifying token');
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

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
