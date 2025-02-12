
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { RequestData, ChatDetectionResult, PlaceDetails, ChatbotDetection } from './types.ts';
import { analyzeChatbot } from './analyzer.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { corsHeaders, addCorsHeaders } from './utils/httpUtils.ts';

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

  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=website,formatted_phone_number,formatted_address,name&key=${GOOGLE_API_KEY}`;
  
  try {
    const response = await fetch(detailsUrl);
    if (!response.ok) {
      throw new Error(`Google Places API returned status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Google Places API response:', data);
    
    if (!data.result) {
      throw new Error('No result found in Places API response');
    }
    
    return {
      website: data.result.website || null,
      phone: data.result.formatted_phone_number || null,
      address: data.result.formatted_address || null,
      business_name: data.result.name || null
    };
  } catch (error) {
    console.error('Error fetching place details:', error);
    throw new Error(`Failed to fetch place details: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting website analysis');
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const contentType = req.headers.get('content-type');
    console.log('Content-Type:', contentType);

    const rawBody = await req.text();
    console.log('Raw request body:', rawBody);

    if (!rawBody) {
      console.error('Empty request body received');
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Request body cannot be empty' }),
        { status: 400 }
      ));
    }

    let requestData: RequestData;
    try {
      requestData = JSON.parse(rawBody);
      console.log('Parsed request data:', requestData);
    } catch (error) {
      console.error('JSON parsing error:', error);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: `Invalid JSON in request body: ${error.message}` }),
        { status: 400 }
      ));
    }

    if (!requestData || typeof requestData !== 'object') {
      console.error('Invalid request data format:', requestData);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'Request body must be a valid JSON object' }),
        { status: 400 }
      ));
    }

    if (!requestData.url) {
      console.error('Missing URL in request:', requestData);
      return addCorsHeaders(new Response(
        JSON.stringify({ error: 'URL is required in request body' }),
        { status: 400 }
      ));
    }

    let websiteUrl = requestData.url;
    let originalUrl = websiteUrl;
    let phone: string | null = null;
    let address: string | null = null;
    let businessName: string | null = null;

    // Handle Google Maps URLs
    if (websiteUrl.includes('maps.google') && requestData.placeId) {
      console.log('Processing Google Maps URL with place ID:', requestData.placeId);
      try {
        const details = await getBusinessWebsite(requestData.placeId);
        if (details.website) {
          websiteUrl = details.website;
        }
        phone = details.phone;
        address = details.address;
        businessName = details.business_name;
        
        console.log('Successfully fetched business details:', {
          websiteUrl,
          businessName,
          phone,
          address
        });
      } catch (error) {
        console.error('Error fetching business details:', error);
        console.log('Continuing with original Maps URL:', websiteUrl);
      }
    }

    // Normalize URL for analysis
    const normalizedUrl = normalizeUrl(websiteUrl);
    console.log('Normalized URL for analysis:', normalizedUrl);
    
    const chatbotPlatforms = await analyzeChatbot(normalizedUrl);
    console.log('Detected chatbot platforms:', chatbotPlatforms);
    
    const timestamp = new Date().toISOString();

    // Prepare detection record
    const detection: ChatbotDetection = {
      url: originalUrl,
      website_url: websiteUrl !== originalUrl ? websiteUrl : null,
      chatbot_platforms: chatbotPlatforms,
      has_chatbot: chatbotPlatforms.length > 0,
      phone,
      address,
      business_name: businessName,
      last_checked: timestamp
    };

    console.log('Saving detection record:', detection);

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
      lastChecked: timestamp,
      website_url: websiteUrl,
      business_name: businessName
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
