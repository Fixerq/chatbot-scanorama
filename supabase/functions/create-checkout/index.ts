import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

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

    const { priceId, returnUrl } = await req.json();
    if (!priceId || !returnUrl) {
      console.error('Missing required parameters');
      throw new Error('Missing required parameters: priceId and returnUrl are required');
    }

    console.log('Creating checkout session for price:', priceId);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1' ? 'payment' : 'subscription',
      success_url: `${returnUrl}/register-and-order?session_id={CHECKOUT_SESSION_ID}&priceId=${priceId}`,
      cancel_url: returnUrl,
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
        status: error instanceof Error && error.message.includes('Authentication') ? 401 : 400,
      },
    );
  }
});