
import { corsHeaders } from '../utils/httpUtils.ts';
import { AnalysisRequest } from '../types.ts';
import { supabase } from '../utils/supabaseClient.ts';
import { processUrl } from '../services/urlProcessor.ts';
import { websiteAnalyzer } from '../services/websiteAnalyzer.ts';

export async function handleRequest(req: Request): Promise<Response> {
  try {
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

    // Handle batch processing
    if (body.isBatch) {
      console.log(`[AnalyzeWebsite] Processing batch ${body.batchId} with ${body.urls.length} URLs`);
      
      for (const url of body.urls) {
        try {
          // Process URL
          const { cleanUrl } = await processUrl(url);
          
          // Update request status to processing
          await supabase
            .from('analysis_requests')
            .update({ 
              status: 'processing',
              started_at: new Date().toISOString()
            })
            .eq('batch_id', body.batchId)
            .eq('url', url);

          // Analyze website
          const analysisResult = await websiteAnalyzer(cleanUrl, body.batchId);

          // Store the analysis result
          await supabase
            .from('analysis_results')
            .insert({
              batch_id: body.batchId,
              url: cleanUrl,
              has_chatbot: analysisResult.has_chatbot,
              chatbot_solutions: analysisResult.chatSolutions || [],
              status: 'completed',
              details: {
                patterns: analysisResult.details?.matches || [],
                lastChecked: new Date().toISOString()
              }
            });

          // Update request as processed
          await supabase
            .from('analysis_requests')
            .update({ 
              status: 'completed',
              processed: true,
              completed_at: new Date().toISOString()
            })
            .eq('batch_id', body.batchId)
            .eq('url', url);

        } catch (error) {
          console.error(`[AnalyzeWebsite] Error processing URL ${url}:`, error);
          
          // Update request as failed
          await supabase
            .from('analysis_requests')
            .update({ 
              status: 'failed',
              processed: true,
              completed_at: new Date().toISOString(),
              error_message: error.message
            })
            .eq('batch_id', body.batchId)
            .eq('url', url);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Batch processing completed' 
        }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      );
    }

    // Handle single URL processing
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

    const { url, requestId } = body as AnalysisRequest;
    console.log(`[AnalyzeWebsite] Processing single request ${requestId} for URL: ${url}`);

    // Process URL
    const { cleanUrl } = await processUrl(url);
    
    // Update request status to processing
    await supabase
      .from('analysis_requests')
      .update({ 
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Run analysis
    const analysisResult = await websiteAnalyzer(cleanUrl, requestId);

    // Store the analysis result
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
      throw resultError;
    }

    // Update request status to completed
    await supabase
      .from('analysis_requests')
      .update({ 
        status: 'completed',
        processed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis completed successfully',
        result: analysisResult
      }),
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
