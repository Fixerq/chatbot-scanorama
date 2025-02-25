
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
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

    console.log('Received analysis result webhook')

    // Parse the webhook payload
    const payload = await req.json()
    console.log('Analysis result payload:', payload)

    if (!payload.url || typeof payload.has_chatbot === 'undefined') {
      throw new Error('Invalid payload: missing required fields')
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
        url: payload.url,
        has_chatbot: payload.has_chatbot,
        chatbot_solutions: payload.chatbot_solutions || [],
        supplier: payload.supplier || null,
        status: 'completed',
        updated_at: new Date().toISOString()
      })

    if (upsertError) {
      console.error('Error upserting result:', upsertError)
      throw upsertError
    }

    console.log('Successfully processed analysis result for URL:', payload.url)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Analysis result processed successfully',
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
    console.error('Error processing analysis result:', error)
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
