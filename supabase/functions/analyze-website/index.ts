
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { url, requestId } = await req.json();
    
    if (!url) {
      throw new Error('URL is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update analysis request status to processing
    if (requestId) {
      await supabaseClient
        .from('analysis_requests')
        .update({ status: 'processing' })
        .eq('id', requestId);
    }

    const result = await websiteAnalyzer(url);

    // Update analysis request with results
    if (requestId) {
      await supabaseClient
        .from('analysis_requests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          analysis_result: result
        })
        .eq('id', requestId);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Analysis error:', error);

    // Update analysis request with error if we have a requestId
    if (req.body && typeof req.body === 'object' && 'requestId' in req.body) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await supabaseClient
        .from('analysis_requests')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', req.body.requestId);
    }

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
