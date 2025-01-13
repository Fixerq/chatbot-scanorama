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

    // Sanitize and validate the return URL
    let sanitizedUrl;
    try {
      sanitizedUrl = new URL(returnUrl);
      // Remove any trailing colons from the hostname
      sanitizedUrl.hostname = sanitizedUrl.hostname.replace(/:+$/, '');
      console.log('Sanitized return URL:', sanitizedUrl.toString());
    } catch (error) {
      console.error('Invalid return URL:', error);
      throw new Error('Invalid return URL provided');
    }

    console.log('Creating checkout session for price:', priceId);

    // Create a new customer
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: {
        supabaseUUID: user.id
      }
    });
    
    console.log('Created new customer:', customer.id);

    // Determine if this is the Founders plan
    const isFoundersPlan = priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1';
    
    console.log('Creating checkout session with mode:', isFoundersPlan ? 'payment' : 'subscription');

    // Ensure returnUrl ends with /register-and-order
    const baseUrl = sanitizedUrl.toString();
    const successUrl = baseUrl + (baseUrl.endsWith('/') ? 'register-and-order' : '/register-and-order');
    
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: isFoundersPlan ? 'payment' : 'subscription',
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}&priceId=${priceId}`,
      cancel_url: baseUrl,
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