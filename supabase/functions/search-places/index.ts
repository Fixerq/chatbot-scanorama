
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SearchParams, BusinessSearchResult, SubscriptionData } from './types.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { verifyUser } from './auth.ts'
import { searchBusinessesWithAI } from './openaiSearch.ts'

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
    const businesses = await searchBusinessesWithAI(params.query, params.region || '', params.country);
    console.log(`Search completed with ${businesses.length} results`);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const results = businesses.map(business => ({
      url: business.website || '',
      details: {
        title: business.name,
        description: business.description,
        lastChecked: new Date().toISOString(),
        address: business.address,
        businessType: business.businessType,
        confidence: business.confidenceScore,
      }
    }));

    const { error: insertError } = await supabase
      .from('analyzed_urls')
      .insert(
        results.map(result => ({
          url: result.url,
          user_id: userId,
          title: result.details.title,
          description: result.details.description,
          status: 'completed',
          details: result.details,
          ai_generated: true,
          confidence_score: result.details.confidence,
          search_query: params.query,
          search_region: params.region || ''
        }))
      );

    if (insertError) {
      console.error('Error recording search results:', insertError);
    }

    return {
      results,
      hasMore: false
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, params } = await req.json()
    console.log('Request received:', { action, params })

    console.log('Auth header:', req.headers.get('Authorization'));
    const userId = await verifyUser(req.headers.get('Authorization'));
    console.log('User verified:', userId);

    if (action === 'search') {
      console.log('Starting search flow');
      const subscription = await getSubscriptionData(userId);
      console.log('Got subscription data:', subscription);
      
      if (subscription.status !== 'active') {
        throw new Error('Subscription is not active');
      }
      
      if (subscription.searches_remaining <= 0) {
        throw new Error('No searches remaining this month');
      }

      const result = await handleSearch(params as SearchParams, userId);
      console.log('Search completed successfully:', result);
      
      return new Response(
        JSON.stringify({ success: true, data: result }),
        { headers: corsHeaders }
      );
    }

    throw new Error('Invalid action type');

  } catch (error) {
    console.error('Error in handleRequest:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  }
});
