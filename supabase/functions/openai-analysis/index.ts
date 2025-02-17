
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.21.0";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl!, supabaseKey!);

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
    console.log('Analyzing URL with OpenAI:', { url, error_context });

    const systemPrompt = `You are an expert system analyst helping improve a website analysis system. 
    Your task is to analyze the current situation and provide recommendations for handling the analysis.
    Focus on optimizing retry strategies and error resolution.`;

    const userPrompt = `
    URL being analyzed: ${url}
    Current patterns: ${JSON.stringify(patterns)}
    Error context: ${JSON.stringify(error_context)}
    
    Please analyze this situation and provide:
    1. Suggested improvements to the pattern matching
    2. Error resolution steps
    3. Confidence level in chatbot detection
    4. Retry strategy recommendations including whether to retry and optimal timing
    
    Format your response as a JSON object with these keys:
    {
      "pattern_improvements": string[],
      "error_resolution": string[],
      "chatbot_confidence": number,
      "retry_strategy": {
        "should_retry": boolean,
        "wait_time": number (in seconds),
        "max_attempts": number
      }
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI analysis result:', data);

    // Store the analysis insights
    const { error: insertError } = await supabase
      .from('ai_analysis_insights')
      .insert({
        url,
        analysis_type: 'worker_optimization',
        insights: data.choices[0].message.content,
        performance_impact: {
          analyzed_at: new Date().toISOString(),
          worker_health: error_context.worker_health
        }
      });

    if (insertError) {
      console.error('Error storing AI analysis:', insertError);
    }

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in OpenAI analysis:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
