
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
    await logFunctionError('analyze-website', 'saveChatbotDetection', { detection }, upsertError);
    throw new Error('Failed to store detection results');
  }
}

export async function logFunctionError(
  functionName: string,
  operation: string,
  requestData: unknown,
  error: unknown
): Promise<void> {
  try {
    const { error: logError } = await supabaseAdmin
      .from('edge_function_logs')
      .insert({
        function_name: functionName,
        request_data: {
          operation,
          data: requestData
        },
        error: error instanceof Error ? error.message : String(error)
      });

    if (logError) {
      console.error('Failed to log error:', logError);
    }
  } catch (loggingError) {
    console.error('Error while logging to database:', loggingError);
  }
}
