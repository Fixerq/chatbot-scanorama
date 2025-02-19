
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebhookPayload {
  url: string;
  has_chatbot: boolean;
  chatbot_solutions: string[];
  supplier?: string;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const webhookSecret = Deno.env.get('ZAPIER_WEBHOOK_SECRET') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    // Get the authorization header and validate it
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Invalid authorization header format');
      return new Response('Unauthorized', {
        status: 401,
        headers: { ...corsHeaders }
      });
    }

    const providedToken = authHeader.split('Bearer ')[1];
    
    // Simple secret comparison - make sure the provided token matches our secret
    if (providedToken !== webhookSecret) {
      console.error('Invalid webhook secret');
      return new Response('Unauthorized', {
        status: 401,
        headers: { ...corsHeaders }
      });
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json();
    console.log('Received webhook payload:', payload);

    if (!payload.url) {
      throw new Error('URL is required in webhook payload');
    }

    // Update the analysis results in the database
    const { error: updateError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: payload.url,
        status: payload.error ? 'error' : 'completed',
        has_chatbot: payload.has_chatbot || false,
        chatbot_solutions: payload.chatbot_solutions || [],
        error: payload.error,
        details: {
          supplier: payload.supplier
        },
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      console.error('Error updating analysis results:', updateError);
      throw updateError;
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process webhook' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

