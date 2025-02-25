
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
}

console.log('Zapier webhook handler running...')

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Log the incoming request
    console.log('Received webhook request:', {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
    })

    // Parse the webhook payload
    const payload = await req.json()
    console.log('Received webhook payload:', payload)

    if (!payload.url) {
      throw new Error('URL is required in payload')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Log successful initialization of Supabase client
    console.log('Supabase client initialized')

    // Simulate analysis result for testing
    const mockAnalysisResult = {
      has_chatbot: Math.random() > 0.5,
      chatbot_solutions: ['Intercom', 'Drift', 'Zendesk'],
      supplier: 'Test Supplier'
    }

    // Update the analysis result in the database
    const { error: upsertError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url: payload.url,
        has_chatbot: mockAnalysisResult.has_chatbot,
        chatbot_solutions: mockAnalysisResult.chatbot_solutions,
        supplier: mockAnalysisResult.supplier,
        status: 'completed',
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error upserting result:', upsertError)
      throw upsertError
    }

    console.log('Successfully processed webhook for URL:', payload.url)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Webhook processed successfully',
        url: payload.url
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
        status: 400,
      }
    )
  }
})
