import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  try {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const { priceId, productId, successUrl, cancelUrl } = await req.json();
    
    if (!priceId || !productId) {
      console.error('Missing required parameters:', { priceId, productId });
      throw new Error('Price ID and Product ID are required');
    }

    console.log('Creating guest checkout session for:', { priceId, productId });
    
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      throw new Error('Missing Stripe secret key');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: priceId, quantity: 1 }],
      mode: priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1' ? 'payment' : 'subscription',
      success_url: successUrl || `${req.headers.get('origin')}/register-and-order?session_id={CHECKOUT_SESSION_ID}&priceId=${encodeURIComponent(priceId)}&planName=Founders%20Plan`,
      cancel_url: cancelUrl || `${req.headers.get('origin')}/sales`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
    });

    console.log('Checkout session created:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in guest checkout:', error);
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