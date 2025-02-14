
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';

serve(async (req) => {
  console.log('Received request:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  });

  // Always add CORS headers to all responses
  const responseHeaders = {
    ...corsHeaders,
    'Content-Type': 'application/json'
  };

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: responseHeaders,
      status: 204 
    });
  }

  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let executionId: string | null = null;

  try {
    // Create execution record
    const { data: executionData, error: executionError } = await supabaseClient
      .from('function_executions')
      .insert({
        function_name: 'analyze-website',
        status: 'running'
      })
      .select()
      .single();

    if (executionError) {
      console.error('Error creating execution record:', executionError);
      throw new Error('Failed to create execution record');
    }

    executionId = executionData.id;
    console.log('Created execution record:', executionId);

    // Read request body
    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    // Parse JSON safely
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
          headers: responseHeaders
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
          headers: responseHeaders
        }
      );
    }

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

    // Update execution record as completed
    if (executionId) {
      const endTime = new Date();
      const { error: completionError } = await supabaseClient
        .from('function_executions')
        .update({
          status: 'completed',
          completed_at: endTime.toISOString(),
          execution_time: `${(endTime.getTime() - new Date(executionData.started_at).getTime()) / 1000} seconds`
        })
        .eq('id', executionId);

      if (completionError) {
        console.error('Error updating execution record:', completionError);
      }
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: responseHeaders,
        status: 200,
      },
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    try {
      // Update execution record as failed
      if (executionId) {
        const endTime = new Date();
        await supabaseClient
          .from('function_executions')
          .update({
            status: 'failed',
            completed_at: endTime.toISOString(),
            error_message: errorMessage
          })
          .eq('id', executionId);
      }

      if (requestId) {
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
      console.error('Error updating status:', updateError);
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
        headers: responseHeaders,
        status: 200,
      },
    );
  }
});

