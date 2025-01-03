import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHAT_SOLUTIONS = {
  'Intercom': ['.intercom-frame', '#intercom-container'],
  'Drift': ['#drift-widget', '.drift-frame-controller'],
  'Zendesk': ['.zEWidget-launcher', '#launcher'],
  'Crisp': ['.crisp-client', '#crisp-chatbox'],
  'LiveChat': ['#livechat-compact-container', '#chat-widget-container'],
  'Tawk.to': ['#tawkchat-container', '#tawkchat-minified-wrapper'],
  'HubSpot': ['#hubspot-messages-iframe-container', '.HubSpotWebWidget'],
  'Facebook Messenger': ['.fb-customerchat', '.fb_dialog'],
  'WhatsApp': ['.wa-chat-box', '.whatsapp-chat'],
  'Custom Chat': ['[class*="chat"]', '[class*="messenger"]', '[id*="chat"]', '[id*="messenger"]']
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { url } = await req.json()
    console.log('Analyzing URL:', url)

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check cache first
    const { data: cachedResult } = await supabaseClient
      .from('analyzed_urls')
      .select('*')
      .eq('url', url)
      .single()

    if (cachedResult) {
      const cacheAge = Date.now() - new Date(cachedResult.created_at).getTime()
      const cacheValidityPeriod = 24 * 60 * 60 * 1000 // 24 hours

      if (cacheAge < cacheValidityPeriod) {
        console.log('Using cached result for', url)
        return new Response(JSON.stringify(cachedResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // Fetch and analyze the website
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const html = await response.text()

    // Detect chat solutions
    const detectedChatSolutions = []
    for (const [solution, selectors] of Object.entries(CHAT_SOLUTIONS)) {
      if (selectors.some(selector => html.includes(selector))) {
        detectedChatSolutions.push(solution)
      }
    }

    const result = {
      url,
      status: detectedChatSolutions.length > 0 ? 
        `Chatbot detected (${detectedChatSolutions.join(', ')})` : 
        'No chatbot detected',
      details: {
        chatSolutions: detectedChatSolutions,
        lastChecked: new Date().toISOString()
      },
      technologies: []
    }

    // Cache the result
    await supabaseClient
      .from('analyzed_urls')
      .upsert({
        url: result.url,
        status: result.status,
        details: result.details,
        technologies: result.technologies
      })

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error analyzing website:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const result = {
      url,
      status: `Error: ${errorMessage}`,
      details: { errorDetails: errorMessage },
      technologies: []
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Still return 200 to handle the error gracefully on the client
    })
  }
})