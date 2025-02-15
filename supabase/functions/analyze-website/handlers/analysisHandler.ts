
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';
import { ChatDetectionResult } from '../types.ts';
import { processUrl } from '../services/urlProcessor.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';

export interface ExecutionRecord {
  id: string;
  started_at: string;
}

export async function handleAnalysisRequest(req: Request) {
  let executionId: string | null = null;
  let supabaseClient: ReturnType<typeof createClient>;

  try {
    console.log('[AnalysisHandler] Request details:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      url: req.url
    });

    const rawBody = await req.text();
    console.log('[AnalysisHandler] Raw request body:', rawBody);

    let parsedBody;
    try {
      parsedBody = JSON.parse(rawBody);
      console.log('[AnalysisHandler] Parsed request body:', parsedBody);
    } catch (parseError) {
      console.error('[AnalysisHandler] JSON parsing error:', parseError);
      throw new Error(`Invalid JSON in request body: ${parseError.message}`);
    }

    if (!parsedBody?.url) {
      console.error('[AnalysisHandler] Missing URL in request body:', parsedBody);
      throw new Error('URL is required in request body');
    }

    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create execution record
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
      console.error('[AnalysisHandler] Error creating execution record:', executionError);
      throw new Error('Failed to create execution record');
    }

    executionId = executionData.id;
    console.log('[AnalysisHandler] Created execution record:', executionId);

    // Process request
    const result = await processAnalysisRequest(parsedBody, supabaseClient);

    // Update execution record with success
    await updateExecutionRecord(supabaseClient, executionId, executionData, result, 'completed');

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[AnalysisHandler] Analysis error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';

    if (executionId && supabaseClient) {
      await handleError(supabaseClient, executionId, parsedBody?.requestId, errorMessage);
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
}

async function processAnalysisRequest(parsedBody: any, supabaseClient: ReturnType<typeof createClient>): Promise<ChatDetectionResult> {
  const { url, requestId } = parsedBody;
  console.log('[AnalysisHandler] Processing URL and requestId:', { url, requestId });

  if (!url || !requestId) {
    console.error('[AnalysisHandler] Missing required fields:', { url, requestId });
    throw new Error('Both "url" and "requestId" must be provided');
  }

  // Process URL
  const { cleanUrl } = await processUrl(url);
  console.log('[AnalysisHandler] Processed URLs:', { cleanUrl, originalUrl: url });

  // Update analysis request status
  const { error: updateError } = await supabaseClient
    .from('analysis_requests')
    .update({ 
      status: 'processing',
      started_at: new Date().toISOString()
    })
    .eq('id', requestId);

  if (updateError) {
    console.error('[AnalysisHandler] Error updating request status:', updateError);
    throw new Error('Failed to update request status');
  }

  // Analyze website
  console.log('[AnalysisHandler] Starting website analysis for:', cleanUrl);
  const result = await websiteAnalyzer(cleanUrl);

  // Save analysis results
  await saveAnalysisResults(supabaseClient, cleanUrl, result, requestId);

  return result;
}

async function saveAnalysisResults(
  supabaseClient: ReturnType<typeof createClient>, 
  cleanUrl: string, 
  result: ChatDetectionResult, 
  requestId: string
) {
  // Save to analysis_results
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
    console.error('[AnalysisHandler] Error saving analysis result:', analysisError);
    throw new Error(`Failed to save analysis result: ${analysisError.message}`);
  }

  // Update analysis request
  const { error: resultError } = await supabaseClient
    .from('analysis_requests')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      analysis_result: result
    })
    .eq('id', requestId);

  if (resultError) {
    console.error('[AnalysisHandler] Error updating analysis results:', resultError);
    throw new Error('Failed to update analysis results');
  }
}

async function updateExecutionRecord(
  supabaseClient: ReturnType<typeof createClient>,
  executionId: string,
  executionData: ExecutionRecord,
  result: ChatDetectionResult,
  status: 'completed' | 'failed'
) {
  const endTime = new Date();
  const { error: completionError } = await supabaseClient
    .from('function_executions')
    .update({
      status,
      completed_at: endTime.toISOString(),
      execution_time: `${(endTime.getTime() - new Date(executionData.started_at).getTime()) / 1000} seconds`,
      response_body: result
    })
    .eq('id', executionId);

  if (completionError) {
    console.error('[AnalysisHandler] Error updating execution record:', completionError);
  }
}

async function handleError(
  supabaseClient: ReturnType<typeof createClient>,
  executionId: string,
  requestId: string | undefined,
  errorMessage: string
) {
  try {
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
    console.error('[AnalysisHandler] Error updating status:', updateError);
  }
}
