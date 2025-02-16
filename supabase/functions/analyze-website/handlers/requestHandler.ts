
import { corsHeaders } from '../utils/httpUtils.ts';
import { AnalysisRequest } from '../types.ts';
import { supabase } from '../utils/supabaseClient.ts';
import { processUrl } from '../services/urlProcessor.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';

export async function handleRequest(req: Request): Promise<Response> {
  try {
    // Parse and validate the request body
    const body = await req.json().catch(() => null);
    
    console.log('[AnalyzeWebsite] Received request body:', body);
    
    if (!body) {
      console.error('[AnalyzeWebsite] Missing request body');
      return new Response(
        JSON.stringify({
          error: 'Request body is required',
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

    if (!body.url) {
      console.error('[AnalyzeWebsite] Missing URL in request:', body);
      return new Response(
        JSON.stringify({
          error: 'URL is required in request',
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

    if (!body.requestId) {
      console.error('[AnalyzeWebsite] Missing requestId in request:', body);
      return new Response(
        JSON.stringify({
          error: 'requestId is required in request',
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

    // First validate and clean the URL
    const { cleanUrl } = await processUrl(url);

    // Add the URL to the analysis queue
    const { data: queueData, error: queueError } = await supabase
      .from('analysis_queue')
      .insert({
        url: cleanUrl,
        status: 'pending',
        max_retries: 3,
        retry_count: 0,
        priority: 1,
        metadata: {
          original_url: url,
          request_id: requestId
        }
      })
      .select()
      .single();

    if (queueError) {
      console.error('[AnalyzeWebsite] Error adding to queue:', queueError);
      throw queueError;
    }

    // Update request status to processing
    const { error: updateError } = await supabase
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('[AnalyzeWebsite] Error updating request status:', updateError);
      throw updateError;
    }

    // Run analysis in the background using Edge Runtime
    EdgeRuntime.waitUntil((async () => {
      try {
        // Update queue item to processing
        await supabase
          .from('analysis_queue')
          .update({ 
            status: 'processing',
            started_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        // Perform actual website analysis
        const analysisResult = await websiteAnalyzer(cleanUrl, requestId);

        // Store the analysis result and pattern matches
        const { error: resultError } = await supabase
          .from('analysis_results')
          .insert({
            request_id: requestId,
            url: cleanUrl,
            has_chatbot: analysisResult.has_chatbot,
            chatbot_solutions: analysisResult.chatSolutions || [],
            status: 'completed',
            details: {
              patterns: analysisResult.details?.matches || [],
              lastChecked: new Date().toISOString()
            }
          });

        if (resultError) {
          console.error('[AnalyzeWebsite] Error storing analysis result:', resultError);
          throw resultError;
        }

        // Store pattern matches if any were found
        if (analysisResult.details?.matches?.length > 0) {
          const patternMatches = analysisResult.details.matches.map(match => ({
            queue_id: queueData.id,
            pattern_type: match.type,
            pattern_value: match.pattern,
            matched_content: match.matched,
            confidence_score: 1.0 // Default confidence for now
          }));

          const { error: matchError } = await supabase
            .from('pattern_matches')
            .insert(patternMatches);

          if (matchError) {
            console.error('[AnalyzeWebsite] Error storing pattern matches:', matchError);
            // Don't throw here as we still want to complete the queue item
          }
        }

        // Update queue item to completed
        await supabase
          .from('analysis_queue')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        // Update request status to completed
        await supabase
          .from('analysis_requests')
          .update({ 
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', requestId);

      } catch (error) {
        console.error('[AnalyzeWebsite] Background processing error:', error);
        
        // Update queue item to failed
        await supabase
          .from('analysis_queue')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', queueData.id);

        // Update request status to failed
        await supabase
          .from('analysis_requests')
          .update({ 
            status: 'failed',
            error_message: error.message,
            completed_at: new Date().toISOString()
          })
          .eq('id', requestId);
      }
    })());

    // Return immediate response with queue status
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis queued successfully',
        queue_id: queueData.id,
        status: 'processing'
      }),
      {
        status: 202,
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
