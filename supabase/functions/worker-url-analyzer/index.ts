import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WorkerState {
  id: string;
  heartbeatInterval: number;
}

let workerState: WorkerState | null = null;

// Register worker and get ID
async function registerWorker(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from('worker_instances')
    .insert({
      status: 'idle',
      last_heartbeat: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error registering worker:', error);
    throw error;
  }

  return data.id;
}

// Send heartbeat to keep worker active
async function sendHeartbeat(supabase: ReturnType<typeof createClient>, workerId: string) {
  const { error } = await supabase
    .from('worker_instances')
    .update({
      last_heartbeat: new Date().toISOString()
    })
    .eq('id', workerId);

  if (error) {
    console.error('Error sending heartbeat:', error);
  }
}

// Process the job queue
async function processJobQueue(supabase: ReturnType<typeof createClient>, workerId: string) {
  // Get next available job
  const { data: job, error: jobError } = await supabase
    .from('analysis_job_queue')
    .select('*')
    .eq('status', 'pending')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (jobError || !job) {
    return;
  }

  // Update job status to processing
  await supabase
    .from('analysis_job_queue')
    .update({
      status: 'processing',
      worker_id: workerId,
      started_at: new Date().toISOString()
    })
    .eq('id', job.id);

  try {
    // Process each request in the batch
    for (const requestId of job.request_ids) {
      const { data: request } = await supabase
        .from('analysis_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (!request) continue;

      // Update request status
      await supabase
        .from('analysis_requests')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', requestId);

      try {
        // Invoke the analyze-website function
        const { data: analysisResult, error: analysisError } = await supabase.functions.invoke(
          'analyze-website',
          {
            body: {
              url: request.url,
              requestId: request.id
            }
          }
        );

        if (analysisError) {
          throw analysisError;
        }

        // Store analysis result
        await supabase
          .from('analysis_results')
          .insert({
            request_id: requestId,
            url: request.url,
            user_id: request.user_id,
            status: 'completed',
            ...analysisResult
          });

        // Update request status to completed  
        await supabase
          .from('analysis_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', requestId);

      } catch (error) {
        console.error(`Error processing request ${requestId}:`, error);
        
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
    }

    // Update job status to completed
    await supabase
      .from('analysis_job_queue')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

  } catch (error) {
    console.error('Error processing job:', error);
    
    // Update job status to failed
    await supabase
      .from('analysis_job_queue')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize worker if not already running
    if (!workerState) {
      const workerId = await registerWorker(supabase);
      workerState = {
        id: workerId,
        heartbeatInterval: setInterval(async () => {
          await sendHeartbeat(supabase, workerId);
        }, 30000) // Send heartbeat every 30 seconds
      };

      // Start processing loop
      setInterval(async () => {
        if (workerState) {
          await processJobQueue(supabase, workerState.id);
        }
      }, 5000); // Check for new jobs every 5 seconds
    }

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Worker is running',
        workerId: workerState.id
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Worker error:', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        message: error.message
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});

// Handle shutdown
addEventListener('beforeunload', async (event) => {
  if (workerState) {
    clearInterval(workerState.heartbeatInterval);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Update worker status to inactive
    await supabase
      .from('worker_instances')
      .update({ status: 'failed' })
      .eq('id', workerState.id);
    
    workerState = null;
  }
});
