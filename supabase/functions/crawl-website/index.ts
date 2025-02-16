
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"
import { FirecrawlApp } from "https://esm.sh/@mendable/firecrawl-js@latest"

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
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Initialize Firecrawl
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')!;
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });

    // Get auth user if available
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!userError && user) {
        userId = user.id;
      }
    }

    // Create initial crawl record
    const { data: crawlRecord, error: insertError } = await supabase
      .from('crawl_results')
      .insert({
        url,
        status: 'processing',
        user_id: userId,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating crawl record:', insertError);
      throw insertError;
    }

    try {
      console.log('Starting crawl for URL:', url);
      const crawlResponse = await firecrawl.crawlUrl(url, {
        limit: 100,
        scrapeOptions: {
          formats: ['markdown', 'html'],
        }
      });

      if (!crawlResponse.success) {
        throw new Error(crawlResponse.error || 'Crawl failed');
      }

      // Update crawl record with results
      const { error: updateError } = await supabase
        .from('crawl_results')
        .update({
          status: 'completed',
          result: crawlResponse,
          completed_at: new Date().toISOString()
        })
        .eq('id', crawlRecord.id);

      if (updateError) {
        console.error('Error updating crawl record:', updateError);
        throw updateError;
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: crawlResponse,
          crawlId: crawlRecord.id 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    } catch (crawlError) {
      // Update crawl record with error
      const { error: updateError } = await supabase
        .from('crawl_results')
        .update({
          status: 'failed',
          error: crawlError.message,
          completed_at: new Date().toISOString()
        })
        .eq('id', crawlRecord.id);

      if (updateError) {
        console.error('Error updating crawl record:', updateError);
      }

      throw crawlError;
    }
  } catch (error) {
    console.error('Crawl error:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An error occurred during the crawl' 
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
