
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Create a new worker instance
    const { data: workerData, error: workerError } = await supabase
      .from('worker_instances')
      .insert({
        status: 'idle',
        last_heartbeat: new Date().toISOString()
      })
      .select()
      .single();

    if (workerError) {
      console.error('Error creating worker instance:', workerError);
      throw workerError;
    }

    console.log('Worker instance created:', workerData);

    return new Response(
      JSON.stringify({ 
        status: 'success',
        message: 'Worker started successfully',
        worker_id: workerData.id
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  } catch (error) {
    console.error('Error starting worker:', error);
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
