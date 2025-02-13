
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

export async function checkRateLimit(supabaseClient: any, ip: string): Promise<boolean> {
  const { data: rateLimit, error } = await supabaseClient
    .from('rate_limits')
    .select('*')
    .eq('ip', ip)
    .single();

  const now = new Date();

  if (error) {
    // No existing rate limit record found
    const { error: insertError } = await supabaseClient
      .from('rate_limits')
      .insert([{
        ip,
        requests_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString()
      }]);

    if (insertError) {
      console.error('Error creating rate limit:', insertError);
      return false;
    }
    return true;
  }

  const windowStart = new Date(rateLimit.window_start);
  const minutesSinceStart = (now.getTime() - windowStart.getTime()) / (1000 * 60);

  if (minutesSinceStart >= 60) {
    // Reset window if it's expired
    const { error: updateError } = await supabaseClient
      .from('rate_limits')
      .update({
        requests_count: 1,
        window_start: now.toISOString(),
        last_request: now.toISOString()
      })
      .eq('ip', ip);

    if (updateError) {
      console.error('Error resetting rate limit:', updateError);
      return false;
    }
    return true;
  }

  if (rateLimit.requests_count >= 60) {
    return false;
  }

  // Increment request count
  const { error: updateError } = await supabaseClient
    .from('rate_limits')
    .update({
      requests_count: rateLimit.requests_count + 1,
      last_request: now.toISOString()
    })
    .eq('ip', ip);

  if (updateError) {
    console.error('Error updating rate limit:', updateError);
    return false;
  }

  return true;
}

