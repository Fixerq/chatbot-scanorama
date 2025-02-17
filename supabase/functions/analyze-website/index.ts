
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { websiteAnalyzer } from "./services/websiteAnalyzer.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { urls, url, batchId, isBatch } = body;

    // Validate required parameters
    if (isBatch && (!urls || !Array.isArray(urls) || urls.length === 0)) {
      throw new Error('URLs array is required for batch processing');
    }
    
    if (!isBatch && !url) {
      throw new Error('URL is required for single analysis');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (isBatch) {
      console.log(`Processing batch of ${urls.length} URLs with batch ID: ${batchId}`);
      
      // Queue analysis jobs for each URL in the batch
      for (const url of urls) {
        const { data: job, error: queueError } = await supabase
          .from('analysis_job_queue')
          .insert({
            url,
            batch_id: batchId,
            status: 'pending',
          })
          .select()
          .single();

        if (queueError) {
          console.error(`Error queuing job for URL ${url}:`, queueError);
          throw queueError;
        }
        
        console.log(`Queued analysis job for URL ${url} with ID: ${job.id}`);
      }

      return new Response(
        JSON.stringify({
          status: 'queued',
          message: `Queued ${urls.length} URLs for analysis`,
          batchId
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } else {
      // Handle single URL analysis
      console.log(`Processing single URL: ${url}`);
      
      const { data: job, error: queueError } = await supabase
        .from('analysis_job_queue')
        .insert({
          url,
          status: 'pending',
        })
        .select()
        .single();

      if (queueError) {
        throw queueError;
      }

      return new Response(
        JSON.stringify({
          status: 'queued',
          jobId: job.id,
          message: 'Analysis job queued successfully'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
