import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 204, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Received guest checkout request');
    const { priceId, successUrl, cancelUrl } = await req.json();
    
    if (!priceId || !successUrl || !cancelUrl) {
      console.error('Missing required parameters:', { priceId, successUrl, cancelUrl });
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: priceId, successUrl, and cancelUrl are required' }),
        {
          status: 400,
          headers: corsHeaders,
        }
      );
    }

    console.log('Creating guest checkout session for price:', priceId);

    // Get plan name based on priceId
    const planName = getPlanName(priceId);
    const isFoundersPlan = priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1';
    
    console.log('Creating checkout session with plan:', { planName, isFoundersPlan });

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isFoundersPlan ? 'payment' : 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      billing_address_collection: 'required',
      payment_method_types: ['card'],
      allow_promotion_codes: true,
      metadata: {
        planName: planName,
      },
    });

    console.log('Checkout session created successfully:', session.id);

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        headers: corsHeaders,
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: corsHeaders,
        status: 400,
      },
    );
  }
});

function getPlanName(priceId: string): string {
  switch (priceId) {
    case 'price_1QfP20EiWhAkWDnrDhllA5a1':
      return 'Founders Plan';
    case 'price_1QeakhEiWhAkWDnrevEe12PJ':
      return 'Starter Plan';
    case 'price_1QeakhEiWhAkWDnrnZgRSuyR':
      return 'Premium Plan';
    default:
      return 'Selected Plan';
  }
}