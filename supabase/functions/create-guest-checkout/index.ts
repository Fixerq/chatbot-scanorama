import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders
    });
  }

  try {
    console.log('Received guest checkout request');
    const { priceId, successUrl, cancelUrl } = await req.json();
    
    if (!priceId || !successUrl || !cancelUrl) {
      console.error('Missing required parameters');
      throw new Error('Missing required parameters');
    }

    console.log('Creating guest checkout session for price:', priceId);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&priceId=${priceId}&planName=${encodeURIComponent(getPlanName(priceId))}`,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      customer_creation: 'always',
    });

    console.log('Created guest checkout session:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in guest checkout process:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});

function getPlanName(priceId: string): string {
  switch (priceId) {
    case 'price_1QfP20EiWhAkWDnrDhllA5a1':
      return 'Founders Plan';
    case 'price_1QfP3LEiWhAkWDnrTYVVFBk9':
      return 'Pro Plan';
    case 'price_1QfP4KEiWhAkWDnrNXFYWR9L':
      return 'Starter Plan';
    default:
      return 'Selected Plan';
  }
}