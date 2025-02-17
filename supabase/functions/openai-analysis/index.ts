
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

    const systemPrompt = `You are an expert system analyst specializing in distributed worker systems and web crawling.
    Your task is to analyze the current situation and provide actionable recommendations for handling website analysis tasks.
    Focus on:
    1. Worker initialization and health monitoring
    2. Queue management and job distribution
    3. Error recovery and retry strategies
    4. Pattern matching optimization
    You must respond with valid JSON only. Do not include any markdown formatting or explanatory text.`;

    const userPrompt = `
    Analysis Context:
    URL: ${url}
    Current Detection Patterns: ${JSON.stringify(patterns)}
    System State: ${JSON.stringify(error_context)}
    
    Analyze this situation and provide recommendations in a JSON object with these exact keys:
    {
      "diagnosis": {
        "worker_state": "<description of current worker state>",
        "job_queue": "<description of queue status>",
        "potential_issues": ["issue1", "issue2"]
      },
      "pattern_improvements": ["improvement1", "improvement2"],
      "error_resolution": ["step1", "step2"],
      "chatbot_confidence": <number between 0 and 1>,
      "retry_strategy": {
        "should_retry": <boolean>,
        "wait_time": <number in milliseconds>,
        "max_attempts": <number>
      },
      "worker_recovery": {
        "should_restart": <boolean>,
        "actions": ["action1", "action2"],
        "health_checks": ["check1", "check2"]
      },
      "job_optimizations": {
        "batch_size": <number>,
        "priority_rules": ["rule1", "rule2"],
        "timeout_settings": {
          "initial": <number in milliseconds>,
          "retry": <number in milliseconds>
        }
      }
    }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent, structured output
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    // Validate and parse the AI response
    let aiResponse;
    try {
      // Extract the content and ensure it's valid JSON
      const content = data.choices[0].message.content.trim();
      aiResponse = JSON.parse(content);
      
      // Basic validation of required fields
      if (!aiResponse.diagnosis || !aiResponse.retry_strategy || !aiResponse.job_optimizations) {
        throw new Error('Missing required fields in AI response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      throw new Error('Failed to parse AI response into valid JSON');
    }

    // Store the analysis insights for monitoring
    const { error: insertError } = await supabase
      .from('ai_analysis_insights')
      .insert({
        url,
        analysis_type: 'worker_system_optimization',
        insights: aiResponse,
        performance_impact: {
          analyzed_at: new Date().toISOString(),
          worker_health: error_context.worker_health,
          queue_state: error_context.queue_state
        }
      });

    if (insertError) {
      console.error('Error storing AI analysis:', insertError);
    }

    return new Response(JSON.stringify({ ...data, parsed_response: aiResponse }), {
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

