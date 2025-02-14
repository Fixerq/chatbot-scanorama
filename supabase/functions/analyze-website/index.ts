
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';

serve(async (req) => {
  // Always handle CORS preflight requests first
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Log request details for debugging
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));

    // Clone request to safely read body
    const clonedReq = req.clone();
    const bodyText = await clonedReq.text();
    console.log('Raw request body:', bodyText);

    // Validate that we have a non-empty body
    if (!bodyText || bodyText.trim() === '') {
      throw new Error('Request body is empty');
    }

    // Parse JSON body
    let requestData;
    try {
      requestData = JSON.parse(bodyText);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    // Validate request data
    if (!requestData || typeof requestData !== 'object') {
      throw new Error('Request body must be a valid JSON object');
    }

    const { url, requestId } = requestData;
    
    // Validate required fields
    if (!url) {
      throw new Error('URL is required');
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      throw new Error('Invalid URL format - must start with http:// or https://');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update analysis request status to processing if requestId exists
    if (requestId) {
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
    }

    console.log('Starting website analysis for:', url);
    const result = await websiteAnalyzer(url);
    console.log('Analysis completed successfully:', result);

    // Update analysis request with results if requestId exists
    if (requestId) {
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
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json'
        },
        status: 200,
      },
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    console.error('Analysis error:', errorMessage);

    // Try to update analysis request with error if we have a requestId
    if (requestId) {
      try {
        console.log('Updating request with error:', requestId);
        const supabaseClient = createClient(
          Deno.env.get('SUPABASE_URL') ?? '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        const { error: updateError } = await supabaseClient
          .from('analysis_requests')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: errorMessage
          })
          .eq('id', requestId);

        if (updateError) {
          console.error('Error updating request status:', updateError);
        }
      } catch (updateError) {
        console.error('Error updating request status:', updateError);
      }
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
