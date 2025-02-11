
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SearchParams, BusinessSearchResult, SubscriptionData } from './types.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
}

const getTestSearchResults = (params: SearchParams): BusinessSearchResult => {
  console.log('Generating test results for params:', params);
  return {
    results: [
      {
        url: 'https://test-business-1.com',
        details: {
          title: 'Test Business 1',
          description: `A great business in ${params.region || params.country}`,
          lastChecked: new Date().toISOString(),
          address: `123 Main St, ${params.region || ''}, ${params.country}`,
          phone: '+1 555-0123',
          mapsUrl: 'https://maps.google.com',
          types: ['business', 'service'],
          rating: 4.5
        }
      },
      {
        url: 'https://test-business-2.com',
        details: {
          title: 'Test Business 2',
          description: `Another great business in ${params.region || params.country}`,
          lastChecked: new Date().toISOString(),
          address: `456 Oak St, ${params.region || ''}, ${params.country}`,
          phone: '+1 555-0124',
          mapsUrl: 'https://maps.google.com',
          types: ['business', 'shop'],
          rating: 4.8
        }
      }
    ],
    hasMore: false
  };
};

async function handleSearch(params: SearchParams): Promise<BusinessSearchResult> {
  console.log('Processing search with params:', params);
  
  // Return test data for now
  const results = getTestSearchResults(params);
  console.log(`Search completed with ${results.results.length} results`);
  
  return results;
}

async function getSubscriptionData(userId: string): Promise<SubscriptionData> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    // Get the user's subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('level, status, total_searches, stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (subError) throw subError;

    // Get count of searches made this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: searchError } = await supabase
      .from('analyzed_urls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (searchError) throw searchError;

    const searchesUsed = count || 0;
    const totalSearches = subscription.total_searches;
    const remaining = totalSearches === -1 ? 500 : Math.max(0, totalSearches - searchesUsed);

    return {
      level: subscription.level,
      stripe_customer_id: subscription.stripe_customer_id,
      status: subscription.status,
      searches_remaining: remaining,
      searches_used: searchesUsed,
      total_searches: totalSearches === -1 ? 500 : totalSearches
    };
  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return {
      level: 'starter',
      stripe_customer_id: null,
      status: 'active',
      searches_remaining: 500,
      searches_used: 0,
      total_searches: 500
    };
  }
}

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    console.log('Request received:', { action, params })

    // Get user ID from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header missing');
    }
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client to verify token
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error('Invalid authorization token');
    }

    if (action === 'checkSubscription') {
      const subscriptionData = await getSubscriptionData(user.id);
      console.log('Subscription data:', subscriptionData);
      
      return new Response(
        JSON.stringify({ success: true, data: subscriptionData }),
        { headers: corsHeaders }
      );
    }

    if (action === 'search') {
      const searchParams = params as SearchParams;
      const result = await handleSearch(searchParams);
      
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: corsHeaders }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Invalid action type'
      }),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Internal server error'
      }),
      { 
        status: 200, // Always return 200 to avoid CORS issues
        headers: corsHeaders
      }
    );
  }
}

serve(handleRequest)
