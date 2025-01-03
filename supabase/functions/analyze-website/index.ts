import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHAT_SOLUTIONS = {
  'Intercom': ['.intercom-frame', '#intercom-container', 'intercom'],
  'Drift': ['#drift-widget', '.drift-frame-controller', 'drift'],
  'Zendesk': ['.zEWidget-launcher', '#launcher', 'zendesk'],
  'Crisp': ['.crisp-client', '#crisp-chatbox', 'crisp'],
  'LiveChat': ['#livechat-compact-container', '#chat-widget-container', 'livechat'],
  'Tawk.to': ['#tawkchat-container', '#tawkchat-minified-wrapper', 'tawk'],
  'HubSpot': ['#hubspot-messages-iframe-container', '.HubSpotWebWidget', 'hubspot'],
  'Facebook Messenger': ['.fb-customerchat', '.fb_dialog', 'messenger'],
  'WhatsApp': ['.wa-chat-box', '.whatsapp-chat', 'whatsapp'],
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

    // Use Firecrawl API directly with fetch
    const firecrawlApiKey = Deno.env.get('Firecrawl') ?? ''
    console.log('Crawling website with Firecrawl:', url)
    
    const crawlResponse = await fetch('https://api.firecrawl.co/crawl', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${firecrawlApiKey}`
      },
      body: JSON.stringify({
        url,
        limit: 1,
        scrapeOptions: {
          formats: ['html'],
          timeout: 30000
        }
      })
    })

    if (!crawlResponse.ok) {
      throw new Error(`Firecrawl API error: ${crawlResponse.status}`)
    }

    const crawlData = await crawlResponse.json()
    
    if (!crawlData.success || !crawlData.data?.[0]?.html) {
      throw new Error('Failed to crawl website')
    }

    const html = crawlData.data[0].html

    // Detect chat solutions
    const detectedChatSolutions = []
    for (const [solution, selectors] of Object.entries(CHAT_SOLUTIONS)) {
      if (selectors.some(selector => html.toLowerCase().includes(selector.toLowerCase()))) {
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

    console.log('Analysis complete for', url, ':', result.status)
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error analyzing website:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const result = {
      url,
      status: 'Website not accessible - analysis failed',
      details: { 
        errorDetails: errorMessage,
        lastChecked: new Date().toISOString()
      },
      technologies: []
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200 // Still return 200 to handle the error gracefully on the client
    })
  }
})