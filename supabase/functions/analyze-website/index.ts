
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { fetchWebsiteContent } from './utils/httpUtils.ts'
import { normalizeUrl } from './utils/urlUtils.ts'
import { analyzeWebsite, AnalysisOptions } from './analyzer.ts'
import { getCachedResult, cacheResult } from './cache.ts'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { urls, debug = false, verifyResults = false, deepVerification = false, smartDetection = true, confidenceThreshold = 0.5, checkFunctionality = false } = await req.json()

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'No URLs provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Limit to 10 URLs per request to prevent abuse
    const limitedUrls = urls.slice(0, 10)
    
    // Options for the analysis
    const options: AnalysisOptions = {
      debug,
      verifyResults,
      deepVerification,
      smartDetection,
      confidenceThreshold,
      checkFunctionality
    }

    if (debug) console.log(`Processing ${limitedUrls.length} URLs with options:`, options)

    const results = await Promise.all(
      limitedUrls.map(async (url: string) => {
        try {
          const normalizedUrl = normalizeUrl(url)
          
          // Check if we have a cached result first
          const cachedResult = await getCachedResult(normalizedUrl)
          if (cachedResult && !debug) {
            if (debug) console.log(`Using cached result for ${normalizedUrl}`)
            return cachedResult
          }

          // Fetch the website content
          const html = await fetchWebsiteContent(normalizedUrl)
          
          if (!html) {
            return {
              url: normalizedUrl,
              status: 'Error fetching website content',
              hasChatbot: false,
              solutions: [],
              lastChecked: new Date().toISOString()
            }
          }

          // Analyze the website with the specified options
          const result = await analyzeWebsite(normalizedUrl, html, options)
          
          // Cache the result for future use
          await cacheResult(normalizedUrl, result)
          
          return result
        } catch (error) {
          console.error(`Error processing ${url}:`, error)
          return {
            url,
            status: 'Error processing website',
            hasChatbot: false,
            solutions: [],
            lastChecked: new Date().toISOString()
          }
        }
      })
    )

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
