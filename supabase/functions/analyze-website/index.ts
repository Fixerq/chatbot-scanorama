
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { urls, isBatch = false, retry = false, requestId } = await req.json();
    
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('No URLs provided for analysis');
    }

    console.log(`Starting analysis for ${urls.length} URLs, isBatch: ${isBatch}, retry: ${retry}, requestId: ${requestId}`);

    // Process each URL
    const processUrl = async (url: string) => {
      try {
        console.log(`Processing URL: ${url}`);
        
        // Update status to processing
        const { error: updateError } = await supabase
          .from('simplified_analysis_results')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('url', url);

        if (updateError) {
          console.error(`Error updating status for ${url}:`, updateError);
          throw updateError;
        }

        // Simulate analysis with a small delay (2 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const hasChatbot = Math.random() > 0.5; // Mock result for testing
        const solutions = hasChatbot ? ['Intercom', 'Drift'] : [];
        
        // Update with results
        const { error: resultError } = await supabase
          .from('simplified_analysis_results')
          .update({
            status: 'completed',
            has_chatbot: hasChatbot,
            chatbot_solutions: solutions,
            updated_at: new Date().toISOString()
          })
          .eq('url', url);

        if (resultError) {
          console.error(`Error saving results for ${url}:`, resultError);
          throw resultError;
        }

        console.log(`Analysis completed for ${url}, hasChatbot: ${hasChatbot}`);
        return { url, status: 'completed', hasChatbot, solutions };
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        
        // Update with error status
        await supabase
          .from('simplified_analysis_results')
          .update({
            status: 'failed',
            error: error.message,
            updated_at: new Date().toISOString()
          })
          .eq('url', url);

        return { url, status: 'failed', error: error.message };
      }
    };

    // Process URLs
    const results = isBatch 
      ? await Promise.all(urls.map(processUrl))
      : [await processUrl(urls[0])];

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Error in analyze-website function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
