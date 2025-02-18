
import { corsHeaders } from '../_shared/cors.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { urls, isBatch = false, retry = false } = await req.json();
    
    if (!Array.isArray(urls) || urls.length === 0) {
      throw new Error('No URLs provided for analysis');
    }

    console.log(`Starting analysis for ${urls.length} URLs, isBatch: ${isBatch}, retry: ${retry}`);

    // Process each URL
    const processUrl = async (url: string) => {
      try {
        console.log(`Processing URL: ${url}`);
        
        // Update status to processing
        const { error: updateError } = await supabase
          .from('simplified_analysis_results')
          .upsert({
            url,
            status: 'processing',
            updated_at: new Date().toISOString()
          });

        if (updateError) {
          console.error(`Error updating status for ${url}:`, updateError);
          throw updateError;
        }

        // Simulate analysis (replace with actual analysis logic)
        const hasChatbot = Math.random() > 0.5; // Mock result for testing
        const solutions = hasChatbot ? ['Intercom', 'Drift'] : [];
        
        // Update with results
        const { error: resultError } = await supabase
          .from('simplified_analysis_results')
          .upsert({
            url,
            status: 'completed',
            has_chatbot: hasChatbot,
            chatbot_solutions: solutions,
            updated_at: new Date().toISOString()
          });

        if (resultError) {
          console.error(`Error saving results for ${url}:`, resultError);
          throw resultError;
        }

        return { url, status: 'completed' };
      } catch (error) {
        console.error(`Error processing ${url}:`, error);
        
        // Update with error status
        await supabase
          .from('simplified_analysis_results')
          .upsert({
            url,
            status: 'failed',
            error: error.message,
            updated_at: new Date().toISOString()
          });

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
