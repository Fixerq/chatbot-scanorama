
import { corsHeaders } from '../utils/httpUtils.ts';
import { AnalysisRequest } from '../types.ts';
import { supabase } from '../utils/supabaseClient.ts';
import { processUrl } from '../services/urlProcessor.ts';
import { processNextJob } from '../services/jobProcessor.ts';

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
      console.log(`[AnalyzeWebsite] Processing batch with ${body.urls.length} URLs`);
      
      const jobs = [];
      
      for (const url of body.urls) {
        try {
          // Process URL
          const { cleanUrl } = await processUrl(url);
          
          // Create a job for each URL
          const { data: job, error: jobError } = await supabase
            .from('analysis_jobs')
            .insert({
              url: cleanUrl,
              priority: 1,
              metadata: {
                original_url: url,
                batch: true
              }
            })
            .select()
            .single();

          if (jobError) {
            console.error(`[AnalyzeWebsite] Error creating job for URL ${url}:`, jobError);
            continue;
          }

          jobs.push(job);
        } catch (error) {
          console.error(`[AnalyzeWebsite] Error processing URL ${url}:`, error);
        }
      }

      // Start processing one job
      await processNextJob();

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Jobs queued successfully',
          jobs: jobs.map(job => ({ id: job.id, url: job.url }))
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

    const { url } = body as AnalysisRequest;
    console.log(`[AnalyzeWebsite] Processing single URL: ${url}`);

    // Process URL
    const { cleanUrl } = await processUrl(url);
    
    // Create a job for the single URL
    const { data: job, error: jobError } = await supabase
      .from('analysis_jobs')
      .insert({
        url: cleanUrl,
        priority: 2, // Higher priority for single URL requests
        metadata: {
          original_url: url,
          batch: false
        }
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
    }

    // Start processing the job
    await processNextJob();

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Job queued successfully',
        job: {
          id: job.id,
          url: job.url
        }
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
