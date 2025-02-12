
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RequestData, ChatDetectionResult, PlaceDetails, ChatbotDetection } from './types.ts';
import { analyzeChatbot } from './analyzer.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { corsHeaders, addCorsHeaders } from './utils/httpUtils.ts';

// Initialize Supabase client with service role for full access
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      persistSession: false
    }
  }
);

async function getBusinessWebsite(placeId: string): Promise<PlaceDetails> {
  console.log('Fetching place details for:', placeId);
  const GOOGLE_API_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
  
  if (!GOOGLE_API_KEY) {
    console.error('Missing Google Places API Key');
    throw new Error('Google Places API Key not configured');
  }

  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number,formatted_address&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(detailsUrl);
    const data = await response.json();
    
    console.log('Place details response:', data);
    
    return {
      website: data.result?.website,
      phone: data.result?.formatted_phone_number,
      address: data.result?.formatted_address
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw new Error('Failed to fetch place details');
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting website analysis');
    console.log('Request headers:', Object.fromEntries(req.headers));
    
    // First check if we have a body
    if (req.body === null) {
      console.error('Request body is null');
      return new Response(
        JSON.stringify({ error: 'Request body is required' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    // Parse request data with more detailed error handling
    let requestData: RequestData;
    let bodyText: string;
    
    try {
      bodyText = await req.text();
      console.log('Raw request body:', bodyText);
      
      if (!bodyText) {
        console.error('Empty request body');
        return new Response(
          JSON.stringify({ error: 'Request body cannot be empty' }),
          { headers: corsHeaders, status: 400 }
        );
      }
      
      try {
        requestData = JSON.parse(bodyText);
        console.log('Parsed request data:', requestData);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }),
          { headers: corsHeaders, status: 400 }
        );
      }
    } catch (bodyError) {
      console.error('Error reading request body:', bodyError);
      return new Response(
        JSON.stringify({ error: 'Could not read request body' }),
        { headers: corsHeaders, status: 400 }
      );
    }
    
    if (!requestData?.url) {
      console.error('Missing URL in request:', requestData);
      return new Response(
        JSON.stringify({ error: 'URL is required in request body' }),
        { headers: corsHeaders, status: 400 }
      );
    }

    let websiteUrl = requestData.url;
    let phone: string | null = null;
    let address: string | null = null;

    // Handle Google Maps URLs
    if (websiteUrl.includes('maps.google') && requestData.placeId) {
      console.log('Processing Google Maps URL with place ID:', requestData.placeId);
      const details = await getBusinessWebsite(requestData.placeId);
      if (details.website) {
        websiteUrl = details.website;
        phone = details.phone || null;
        address = details.address || null;
      }
    }

    // Normalize and analyze URL
    const normalizedUrl = normalizeUrl(websiteUrl);
    console.log('Normalized URL:', normalizedUrl);
    
    const chatbotPlatforms = await analyzeChatbot(normalizedUrl);
    console.log('Detected chatbot platforms:', chatbotPlatforms);
    
    const timestamp = new Date().toISOString();

    // Prepare detection record
    const detection: ChatbotDetection = {
      url: normalizedUrl,
      chatbot_platforms: chatbotPlatforms,
      has_chatbot: chatbotPlatforms.length > 0,
      phone,
      address,
      last_checked: timestamp
    };

    // Store results in database
    const { error: upsertError } = await supabaseAdmin
      .from('chatbot_detections')
      .upsert(detection, {
        onConflict: 'url'
      });

    if (upsertError) {
      console.error('Database error:', upsertError);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Failed to store detection results' }),
        { status: 500 }
      ));
    }

    // Prepare response
    const result: ChatDetectionResult = {
      status: chatbotPlatforms.length > 0 ? 
        `Chatbot detected (${chatbotPlatforms.join(', ')})` : 
        'No chatbot detected',
      chatSolutions: chatbotPlatforms,
      lastChecked: timestamp
    };

    return addCorsHeaders(new Response(
      JSON.stringify(result),
      { status: 200 }
    ));

  } catch (error) {
    console.error('Analysis error:', error);
    
    const errorResult: ChatDetectionResult = {
      status: `Error: ${error.message}`,
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };

    return addCorsHeaders(new Response(
      JSON.stringify(errorResult),
      { status: error.message.includes('required') ? 400 : 500 }
    ));
  }
});
