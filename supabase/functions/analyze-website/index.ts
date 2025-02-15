
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';
import { processUrl } from './services/urlProcessor.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  let executionId: string | null = null;
  let supabaseClient: ReturnType<typeof createClient>;

  try {
    console.log('[Handler] Request details:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    const rawBody = await req.text();
    console.log('[Handler] Raw request body:', rawBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('[Handler] Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('[Handler] JSON parsing error:', parseError);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    if (!parsedBody?.url) {
      console.error('[Handler] Missing URL in request body:', parsedBody);
      throw new Error('URL is required in request body');
    }

    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create execution record with request body
    const { data: executionData, error: executionError } = await supabaseClient
      .from('function_executions')
      .insert({
        function_name: 'analyze-website',
        status: 'running',
        request_body: parsedBody
      })
      .select()
      .single();

    if (executionError) {
      console.error('[Handler] Error creating execution record:', executionError);
      throw new Error('Failed to create execution record');
    }

    executionId = executionData.id;
    console.log('[Handler] Created execution record:', executionId);

    const { url, requestId } = parsedBody;
    console.log('[Handler] Parsing URL and requestId:', { url, requestId });

    if (!url || !requestId) {
      console.error('[Handler] Missing required fields:', { url, requestId });
      throw new Error('Both "url" and "requestId" must be provided');
    }

    console.log('[Handler] Processing URL:', url);

    // Process URL and log the results
    const { cleanUrl } = await processUrl(url);
    console.log('[Handler] Processed URLs:', { cleanUrl, originalUrl: url });

    // Update analysis request status to processing
    const { error: updateError } = await supabaseClient
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[Handler] Error updating request status:', updateError);
      throw new Error('Failed to update request status');
    }

    console.log('[Handler] Starting website analysis for:', cleanUrl);
    const result = await websiteAnalyzer(cleanUrl);

    // Save to analysis_results with new schema
    const { error: analysisError } = await supabaseClient
      .from('analysis_results')
      .insert({
        url: cleanUrl,
        has_chatbot: result.has_chatbot,
        chatbot_solutions: result.chatSolutions,
        details: result.details,
        match_types: result.details.matchTypes,
        match_patterns: result.details.matches.map(match => ({
          type: match.type,
          pattern: match.pattern
        })),
        status: 'completed',
        last_checked: new Date().toISOString()
      });

    if (analysisError) {
      console.error('[Handler] Error saving analysis result:', analysisError);
      throw new Error(`Failed to save analysis result: ${analysisError.message}`);
    }

    console.log('[Handler] Analysis completed successfully:', result);

    // Update analysis request with results
    const { error: resultError } = await supabaseClient
      .from('analysis_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        analysis_result: result
      })
      .eq('id', requestId);

    if (resultError) {
      console.error('[Handler] Error updating analysis results:', resultError);
      throw new Error('Failed to update analysis results');
    }

    // Update execution record with response data
    if (executionId) {
      const endTime = new Date();
      const { error: completionError } = await supabaseClient
        .from('function_executions')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          execution_time: `${(endTime.getTime() - new Date(executionData.started_at).getTime()) / 1000} seconds`,
          response_body: result
        })
        .eq('id', executionId);

      if (completionError) {
        console.error('[Handler] Error updating execution record:', completionError);
      }
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[Handler] Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    try {
      if (executionId) {
        const endTime = new Date();
        await supabaseClient
          .from('function_executions')
          .update({
            status: 'failed',
            completed_at: endTime.toISOString(),
            error_message: errorMessage,
            response_body: { error: errorMessage, status: 'error' }
          })
          .eq('id', executionId);
      }

      await supabaseClient
        .from('analysis_requests')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', parsedBody?.requestId);

    } catch (updateError) {
      console.error('[Handler] Error updating status:', updateError);
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
        status: 500 
      }
    );
  }
});
