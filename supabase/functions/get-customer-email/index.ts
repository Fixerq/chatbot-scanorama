import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    console.log('Received request to get customer email');
    
    // Validate request method
    if (req.method !== 'POST') {
      throw new Error('Method not allowed');
    }

    const body = await req.json();
    const { sessionId, userId } = body;

    console.log('Request parameters:', { sessionId, userId });

    // If sessionId is provided, get email from Stripe session
    if (sessionId) {
      console.log('Fetching Stripe session:', sessionId);
      const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
      if (!stripeKey) {
        throw new Error('Stripe key not configured');
      }

      const stripe = new Stripe(stripeKey, {
        apiVersion: '2023-10-16',
      });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log('Successfully retrieved Stripe session');
      
      return new Response(
        JSON.stringify({ 
          email: session.customer_details?.email,
          source: 'stripe'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If userId is provided, get email from Supabase auth
    if (userId) {
      console.log('Fetching user from Supabase:', userId);
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase credentials');
      }

      const supabaseClient = createClient(supabaseUrl, supabaseKey);

      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error(`User not found: ${userError.message}`);
      }

      if (!userData.user) {
        console.error('No user data found');
        throw new Error('User not found in database');
      }

      console.log('Successfully found user email');
      return new Response(
        JSON.stringify({ 
          email: userData.user.email,
          source: 'supabase'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Either sessionId or userId must be provided');
  } catch (error) {
    console.error('Error in get-customer-email function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.toString(),
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Method not allowed' ? 405 : 500,
      }
    );
  }
});