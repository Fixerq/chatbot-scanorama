import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Received checkout request');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.error('No token found in Authorization header');
      return new Response(
        JSON.stringify({ error: 'Invalid authorization header format' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Token extracted from auth header');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: userError }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    if (!user?.email) {
      console.error('No user email found');
      return new Response(
        JSON.stringify({ error: 'User email required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Got user:', user.email);

    const { priceId, returnUrl, customerName } = await req.json();
    if (!priceId || !returnUrl) {
      console.error('Missing required parameters');
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: priceId and returnUrl are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log('Creating checkout session for price:', priceId);

    // Always create a new customer with the provided name
    console.log('Creating new customer for:', user.email);
    const customer = await stripe.customers.create({
      email: user.email,
      name: customerName,
      metadata: {
        supabaseUUID: user.id
      }
    });
    
    console.log('Created new customer:', customer.id);

    // Determine if this is the Founders plan (one-time payment) or a subscription
    const isFoundersPlan = priceId === 'price_1QfP20EiWhAkWDnrDhllA5a1';
    
    console.log('Creating checkout session with price:', priceId, 'Mode:', isFoundersPlan ? 'payment' : 'subscription');

    // Ensure returnUrl ends with /register-and-order
    const baseUrl = returnUrl.endsWith('/register-and-order') ? returnUrl : `${returnUrl}/register-and-order`;
    
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: isFoundersPlan ? 'payment' : 'subscription',
      success_url: `${baseUrl}?session_id={CHECKOUT_SESSION_ID}&priceId=${priceId}`,
      cancel_url: `${returnUrl}`,
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