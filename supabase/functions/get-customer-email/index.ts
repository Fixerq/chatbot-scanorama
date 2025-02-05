import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
    console.log('Received request to get customer email');
    const body = await req.json();
    const { sessionId, userId } = body;

    console.log('Request parameters:', { sessionId, userId });

    // If sessionId is provided, get email from Stripe session
    if (sessionId) {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
        apiVersion: '2023-10-16',
      });

      console.log('Fetching Stripe session:', sessionId);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      return new Response(
        JSON.stringify({ email: session.customer_details?.email }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // If userId is provided, get email from Supabase auth
    if (userId) {
      console.log('Fetching user from Supabase:', userId);
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId);
      
      if (userError) {
        console.error('Error fetching user:', userError);
        throw new Error('User not found');
      }

      if (!userData.user) {
        console.error('No user data found');
        throw new Error('User not found');
      }

      console.log('Successfully found user email');
      return new Response(
        JSON.stringify({ email: userData.user.email }),
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
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});