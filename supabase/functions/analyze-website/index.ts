
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { websiteAnalyzer } from './services/websiteAnalyzer.ts';

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: corsHeaders,
      status: 200
    });
  }

  let executionId: string | null = null;
  let supabaseClient: ReturnType<typeof createClient>;

  try {
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

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
      return new Response(
        JSON.stringify({
          error: 'Failed to create execution record',
          status: 'error',
          details: executionError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    executionId = executionData.id;
    console.log('Created execution record:', executionId);

    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    const { url, requestId } = JSON.parse(rawBody);

    if (!url || !requestId) {
      console.error('Missing required fields:', { url, requestId });
      return new Response(
        JSON.stringify({
          error: 'Missing required fields',
          status: 'error',
          details: 'Both "url" and "requestId" must be provided'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      );
    }

    // Update analysis request status to processing
    const { error: updateError } = await supabaseClient
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request status:', updateError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update request status',
          status: 'error',
          details: updateError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    console.log('Starting website analysis for:', url);
    const result = await websiteAnalyzer(url);

    console.log('Analysis completed successfully:', result);

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
      console.error('Error updating analysis results:', resultError);
      return new Response(
        JSON.stringify({
          error: 'Failed to update analysis results',
          status: 'error',
          details: resultError
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      );
    }

    // Update execution record
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    try {
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

      await supabaseClient
        .from('analysis_requests')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: errorMessage
        })
        .eq('id', rawBody?.requestId);

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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
