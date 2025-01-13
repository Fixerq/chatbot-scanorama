import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    console.log('Received checkout request');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('Authentication required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token found in Authorization header');
      throw new Error('Invalid authorization header format');
    }

    console.log('Token extracted from auth header');

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication failed');
    }

    if (!user.email) {
      console.error('No user email found');
      throw new Error('User email required');
    }

    console.log('Got user:', user.email);

    const { priceId, returnUrl } = await req.json();
    if (!priceId || !returnUrl) {
      console.error('Missing required parameters');
      throw new Error('Missing required parameters: priceId and returnUrl are required');
    }

    // Check if customer already exists
    console.log('Checking for existing customer with email:', user.email);
    const existingCustomers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    let customerId;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
      console.log('Found existing customer:', customerId);
      
      // Check if customer already has an active subscription
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        price: priceId,
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        console.error('Customer already has an active subscription');
        throw new Error('You already have an active subscription for this plan');
      }
    } else {
      // Create a new customer
      const newCustomer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUUID: user.id,
        },
      });
      customerId = newCustomer.id;
      console.log('Created new customer:', customerId);
    }

    // Determine if this is the Founders plan
    const isFoundersPlan = priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1';
    console.log('Is Founders plan:', isFoundersPlan);

    // Create checkout session
    console.log('Creating checkout session with mode:', isFoundersPlan ? 'payment' : 'subscription');
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isFoundersPlan ? 'payment' : 'subscription',
      success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&priceId=${priceId}`,
      cancel_url: returnUrl,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      metadata: {
        userId: user.id,
      },
    });

    console.log('Created checkout session:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in checkout process:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: error
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error instanceof Error && error.message.includes('Authentication') ? 401 : 400,
      },
    );
  }
});