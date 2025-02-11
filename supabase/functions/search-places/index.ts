
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SearchParams, BusinessSearchResult, SubscriptionData } from './types.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { searchBusinesses } from './businessSearch.ts'
import { verifyUser } from './auth.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-application-name',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Content-Type': 'application/json',
  'Cache-Control': 'no-cache'
}

async function getSubscriptionData(userId: string): Promise<SubscriptionData> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  try {
    console.log('Fetching subscription data for user:', userId);
    // Get the user's subscription details
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        level,
        status,
        total_searches,
        stripe_customer_id
      `)
      .eq('user_id', userId)
      .maybeSingle();

    if (subError) {
      console.error('Error fetching subscription:', subError);
      throw subError;
    }

    if (!subscription) {
      console.log('No subscription found, returning default starter plan');
      return {
        level: 'starter',
        stripe_customer_id: null,
        status: 'active',
        searches_remaining: 25,
        searches_used: 0,
        total_searches: 25
      };
    }

    // Get count of searches made this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count, error: searchError } = await supabase
      .from('analyzed_urls')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString());

    if (searchError) {
      console.error('Error counting searches:', searchError);
      throw searchError;
    }

    const searchesUsed = count || 0;
    const totalSearches = subscription.total_searches || 25;
    const remaining = Math.max(0, totalSearches - searchesUsed);

    console.log('Subscription data:', {
      level: subscription.level,
      status: subscription.status,
      remaining,
      used: searchesUsed,
      total: totalSearches
    });

    return {
      level: subscription.level,
      stripe_customer_id: subscription.stripe_customer_id,
      status: subscription.status,
      searches_remaining: remaining,
      searches_used: searchesUsed,
      total_searches: totalSearches
    };
  } catch (error) {
    console.error('Error in getSubscriptionData:', error);
    throw error;
  }
}

async function handleSearch(params: SearchParams, userId: string): Promise<BusinessSearchResult> {
  console.log('Processing search with params:', params);
  
  try {
    const results = await searchBusinesses(params);
    console.log(`Search completed with ${results.results.length} results`);
    
    // Record the search in analyzed_urls
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Record each result in the database
    const { error: insertError } = await supabase
      .from('analyzed_urls')
      .insert(
        results.results.map(result => ({
          url: result.url,
          user_id: userId,
          title: result.details.title,
          description: result.details.description,
          status: 'completed',
          details: result.details
        }))
      );

    if (insertError) {
      console.error('Error recording search results:', insertError);
      // Don't throw the error, just log it - we still want to return results
    }

    return results;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

async function handleRequest(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    console.log('Request received:', { action, params })

    const userId = await verifyUser(req.headers.get('Authorization'));

    if (action === 'checkSubscription') {
      const subscriptionData = await getSubscriptionData(userId);
      console.log('Subscription check completed:', subscriptionData);
      
      return new Response(
        JSON.stringify({ success: true, data: subscriptionData }),
        { headers: corsHeaders }
      );
    }

    if (action === 'search') {
      // Check subscription status first
      const subscription = await getSubscriptionData(userId);
      
      if (subscription.status !== 'active') {
        throw new Error('Subscription is not active');
      }
      
      if (subscription.searches_remaining <= 0) {
        throw new Error('No searches remaining this month');
      }

      const searchParams = params as SearchParams;
      const result = await handleSearch(searchParams, userId);
      
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

