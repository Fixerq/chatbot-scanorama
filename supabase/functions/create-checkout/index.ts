import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from "../_shared/cors.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received checkout request');
    
    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('Got auth token');
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user?.email) {
      console.error('Error getting user:', userError);
      throw new Error('Authentication required');
    }

    console.log('Got user:', user.email);

    const { priceId, returnUrl } = await req.json();
    if (!priceId || !returnUrl) {
      console.error('Missing required parameters');
      throw new Error('Missing required parameters: priceId and returnUrl are required');
    }

    console.log('Creating checkout session for price:', priceId);

    // Check if customer exists
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1
    });

    let customerId;
    if (customers.data.length === 0) {
      console.log('Creating new customer for:', user.email);
      // Create a new customer if one doesn't exist
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUUID: user.id
        }
      });
      customerId = customer.id;
    } else {
      customerId = customers.data[0].id;
      console.log('Found existing customer:', customerId);
    }

    // Determine if this is the Founders plan (one-time payment) or a subscription
    const isFoundersPlan = priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1';
    
    console.log('Creating checkout session with price:', priceId, 'Mode:', isFoundersPlan ? 'payment' : 'subscription');

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isFoundersPlan ? 'payment' : 'subscription',
      success_url: `${returnUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}/dashboard`,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
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
        status: 400,
      },
    );
  }
});