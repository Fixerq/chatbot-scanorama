
import { corsHeaders } from '../utils/httpUtils.ts';
import { AnalysisRequest } from '../types.ts';
import { supabase } from '../utils/supabaseClient.ts';

export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Validate the request body
    const body = await req.json().catch(() => null);
    
    if (!body || !body.url || !body.requestId) {
      console.error('[AnalyzeWebsite] Invalid request body:', body);
      return new Response(
        JSON.stringify({
          error: 'Invalid request. URL and requestId are required.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    const { url, requestId } = body as AnalysisRequest;

    console.log(`[AnalyzeWebsite] Processing request ${requestId} for URL: ${url}`);

    // Update request status to processing
    const { error: updateError } = await supabase
      .from('analysis_requests')
      .update({ status: 'processing' })
      .eq('id', requestId);

    if (updateError) {
      console.error('[AnalyzeWebsite] Error updating request status:', updateError);
      throw updateError;
    }

    // TODO: Implement actual website analysis logic here
    // For now, just return a mock result
    const mockAnalysisResult = {
      has_chatbot: Math.random() > 0.5,
      chatbot_solutions: ['Intercom', 'Drift', 'Custom'],
      status: 'completed',
      details: {
        lastChecked: new Date().toISOString(),
        source: 'mock-analysis'
      }
    };

    // Store the analysis result
    const { error: resultError } = await supabase
      .from('analysis_results')
      .insert({
        request_id: requestId,
        url: url,
        has_chatbot: mockAnalysisResult.has_chatbot,
        chatbot_solutions: mockAnalysisResult.chatbot_solutions,
        status: mockAnalysisResult.status,
        details: mockAnalysisResult.details
      });

    if (resultError) {
      console.error('[AnalyzeWebsite] Error storing analysis result:', resultError);
      throw resultError;
    }

    // Update request status to completed
    const { error: finalUpdateError } = await supabase
      .from('analysis_requests')
      .update({ status: 'completed' })
      .eq('id', requestId);

    if (finalUpdateError) {
      console.error('[AnalyzeWebsite] Error updating final status:', finalUpdateError);
      throw finalUpdateError;
    }

    return new Response(
      JSON.stringify({ success: true, result: mockAnalysisResult }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error) {
    console.error('[AnalyzeWebsite] Error processing request:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process request',
        details: error.message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  }
}
