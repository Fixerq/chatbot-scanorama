import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@13.3.0?target=deno";
import { corsHeaders } from "../_shared/cors.ts";

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

    const { sessionId } = await req.json();
    
    if (!sessionId) {
      console.error('No session ID provided');
      throw new Error('Session ID is required');
    }

    console.log('Fetching checkout session:', sessionId);
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      console.error('No session found for ID:', sessionId);
      throw new Error('Session not found');
    }

    console.log('Session retrieved:', {
      id: session.id,
      customerId: session.customer,
      customerEmail: session.customer_email
    });

    let customer = null;
    if (typeof session.customer === 'string') {
      console.log('Fetching customer details for:', session.customer);
      customer = await stripe.customers.retrieve(session.customer);
      console.log('Customer details retrieved:', {
        id: customer.id,
        email: customer.email,
        name: customer.name
      });
    }

    return new Response(
      JSON.stringify({ 
        customer,
        session: {
          id: session.id,
          customer_email: session.customer_email,
          payment_status: session.payment_status
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in get-customer-details:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        details: 'Failed to fetch customer information. Please contact support.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    );
  }
});