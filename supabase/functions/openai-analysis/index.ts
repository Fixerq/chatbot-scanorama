
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, patterns, error_context } = await req.json();

    const messages = [
      {
        role: "system",
        content: `You are an AI expert at analyzing websites and detecting chatbot implementations. 
        Your task is to analyze the given URL, patterns found, and any error context to:
        1. Suggest improvements to the detection patterns
        2. Provide error resolution strategies
        3. Determine if and how to retry failed analyses
        4. Rate your confidence in the analysis`
      },
      {
        role: "user",
        content: `Analyze this website:
        URL: ${url}
        Detected Patterns: ${JSON.stringify(patterns)}
        Error Context: ${JSON.stringify(error_context)}
        
        Provide your analysis in the following JSON format:
        {
          "pattern_improvements": ["suggestion1", "suggestion2"],
          "error_resolution": ["step1", "step2"],
          "retry_strategy": {
            "should_retry": boolean,
            "wait_time": number (seconds),
            "max_attempts": number
          },
          "chatbot_confidence": number (0-1)
        }`
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.7,
      }),
    });

    const result = await response.json();

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in openai-analysis function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
