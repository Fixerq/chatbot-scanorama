
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { ChatDetectionResult, ChatbotDetection } from './types.ts';
import { analyzeChatbot } from './analyzer.ts';
import { normalizeUrl } from './utils/urlUtils.ts';
import { corsHeaders, addCorsHeaders } from './utils/httpUtils.ts';
import { getBusinessWebsite } from './services/placesService.ts';
import { saveChatbotDetection } from './services/databaseService.ts';
import { validateRequest } from './utils/requestValidator.ts';

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

    const requestData = validateRequest(rawBody);
    
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

    await saveChatbotDetection(detection);

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

