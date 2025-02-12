
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ChatbotDetection } from '../types.ts';

const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false
    }
  }
);

export async function saveChatbotDetection(detection: ChatbotDetection): Promise<void> {
  console.log('Saving detection record:', detection);

  const { error: upsertError } = await supabaseAdmin
    .from('chatbot_detections')
    .upsert(detection, {
      onConflict: 'url'
    });

  if (upsertError) {
    console.error('Database error:', upsertError);
    throw new Error('Failed to store detection results');
  }
}

