
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from '@supabase/supabase-js';
import { RequestData, ChatDetectionResult, PlaceDetails, ChatbotDetection } from './types.ts';
import { analyzeChatbot } from './analyzer.ts';
import { normalizeUrl } from './utils/urlUtils.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

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
    
    // Parse request data
    const requestData: RequestData = await req.json();
    console.log('Request data:', requestData);
    
    if (!requestData?.url) {
      throw new Error('URL is required');
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
      throw new Error('Failed to store detection results');
    }

    // Prepare response
    const result: ChatDetectionResult = {
      status: chatbotPlatforms.length > 0 ? 
        `Chatbot detected (${chatbotPlatforms.join(', ')})` : 
        'No chatbot detected',
      chatSolutions: chatbotPlatforms,
      lastChecked: timestamp
    };

    return new Response(
      JSON.stringify(result),
      { headers: corsHeaders }
    );

  } catch (error) {
    console.error('Analysis error:', error);
    
    const errorResult: ChatDetectionResult = {
      status: `Error: ${error.message}`,
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };

    return new Response(
      JSON.stringify(errorResult),
      { 
        headers: corsHeaders,
        status: error.message.includes('required') ? 400 : 500
      }
    );
  }
});
