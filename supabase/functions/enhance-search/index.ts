import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  query: string
  country: string
  region?: string
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, country, region } = await req.json() as RequestBody

    // Generate industry-specific keywords
    const industryKeywords = generateIndustryKeywords(query)
    
    // Generate location-specific terms
    const locationTerms = generateLocationTerms(country, region)
    
    // Combine everything into an enhanced query
    const enhancedQuery = buildEnhancedQuery(query, industryKeywords, locationTerms)

    return new Response(
      JSON.stringify({
        enhancedQuery,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      },
    )
  }
})

function generateIndustryKeywords(query: string): string[] {
  const commonKeywords = ['business', 'company', 'service', 'professional']
  
  const industryMap: Record<string, string[]> = {
    'plumber': ['plumbing', 'leak repair', 'pipe', 'drain', 'water heater'],
    'electrician': ['electrical', 'wiring', 'fuse', 'lighting', 'power'],
    'carpenter': ['carpentry', 'woodwork', 'furniture', 'cabinet', 'renovation'],
    'painter': ['painting', 'decorator', 'wall', 'interior', 'exterior'],
    'landscaper': ['landscaping', 'garden', 'lawn', 'outdoor', 'maintenance'],
    'roofer': ['roofing', 'roof repair', 'gutters', 'shingles', 'leak'],
    'hvac': ['heating', 'cooling', 'air conditioning', 'ventilation', 'furnace']
  }

  const queryLower = query.toLowerCase()
  const industryKeywords = industryMap[queryLower] || []
  
  return [...new Set([...commonKeywords, ...industryKeywords])]
}

function generateLocationTerms(country: string, region?: string): string[] {
  const terms = [country]
  
  if (region) {
    terms.push(region)
    
    // Add common location-specific terms
    terms.push('local', 'near', 'in', 'serving')
  }
  
  return terms
}

function buildEnhancedQuery(query: string, industryKeywords: string[], locationTerms: string[]): string {
  const parts = [
    query,
    ...industryKeywords,
    ...locationTerms
  ]
  
  // Remove duplicates and join with spaces
  return [...new Set(parts)].join(' ')
}