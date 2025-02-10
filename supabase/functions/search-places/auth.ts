
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function verifyUser(authHeader: string | null): Promise<string> {
  if (!authHeader) {
    console.error('No authorization header provided');
    throw new Error('No authorization header');
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      auth: { persistSession: false }
    }
  );

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

  if (authError || !user) {
    console.error('Auth error:', authError);
    throw new Error('Unauthorized');
  }

  console.log('User authenticated:', user.id);
  return user.id;
}
