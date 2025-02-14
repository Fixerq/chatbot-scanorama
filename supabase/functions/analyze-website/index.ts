
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Read request body only once
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    // Parse JSON
    let { url, requestId } = JSON.parse(rawBody);

    // Validate required fields
    if (!url || !requestId) {
      console.error('Missing required fields:', { url, requestId });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          status: 'error',
          details: 'Both "url" and "requestId" must be provided'
        }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      console.error('Invalid URL format:', url);
      return new Response(
        JSON.stringify({
          error: 'Invalid URL format',
          status: 'error',
          details: `URL must start with http:// or https://`
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update analysis request status to processing
    console.log('Updating request status to processing:', requestId);
    const { error: updateError } = await supabaseClient
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
    }

    // Perform analysis
    console.log('Starting website analysis for:', url);
    const result = await websiteAnalyzer(url);
    console.log('Analysis completed successfully:', result);

    // Update analysis request with results
    console.log('Updating request with results:', requestId);
    const { error: resultError } = await supabaseClient
      .from('analysis_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        analysis_result: result
      })
      .eq('id', requestId);

    if (resultError) {
      console.error('Error updating analysis results:', resultError);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    try {
      if (requestId) {
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
          .eq('id', requestId);
      }
    } catch (updateError) {
      console.error('Error updating request status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        status: 'error',
        has_chatbot: false,
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
