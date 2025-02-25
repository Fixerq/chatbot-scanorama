
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

console.log('Zapier webhook handler running...')

interface WebhookPayload {
  url: string
  has_chatbot: boolean
  chatbot_solutions: string[]
  supplier?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    // Parse the webhook payload
    const payload: WebhookPayload = await req.json()
    console.log('Received webhook payload:', payload)

    const { url, has_chatbot, chatbot_solutions, supplier } = payload

    if (!url) {
      throw new Error('URL is required')
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    // Update the analysis result in the database
    const { error: upsertError } = await supabase
      .from('simplified_analysis_results')
      .upsert({
        url,
        has_chatbot,
        chatbot_solutions,
        supplier,
        status: 'completed',
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error upserting result:', upsertError)
      throw upsertError
    }

    return new Response(
      JSON.stringify({ success: true }),
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
      JSON.stringify({ error: error.message }),
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
