
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
    Provide specific, technical recommendations that can be implemented.`;

    const userPrompt = `
    Analysis Context:
    URL: ${url}
    Current Detection Patterns: ${JSON.stringify(patterns)}
    System State: ${JSON.stringify(error_context)}
    
    Analyze this situation and provide:
    1. Diagnosis of potential worker initialization or job distribution issues
    2. Recommendations for pattern matching improvements
    3. Specific error resolution steps
    4. Worker recovery strategy
    5. Job processing optimizations
    
    Format your response as a JSON object with these keys:
    {
      "diagnosis": {
        "worker_state": string,
        "job_queue": string,
        "potential_issues": string[]
      },
      "pattern_improvements": string[],
      "error_resolution": string[],
      "worker_recovery": {
        "should_restart": boolean,
        "actions": string[],
        "health_checks": string[]
      },
      "job_optimizations": {
        "batch_size": number,
        "priority_rules": string[],
        "timeout_settings": {
          "initial": number,
          "retry": number
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
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('OpenAI analysis result:', data);

    // Store the analysis insights for monitoring
    const { error: insertError } = await supabase
      .from('ai_analysis_insights')
      .insert({
        url,
        analysis_type: 'worker_system_optimization',
        insights: data.choices[0].message.content,
        performance_impact: {
          analyzed_at: new Date().toISOString(),
          worker_health: error_context.worker_health,
          queue_state: error_context.queue_state
        }
      });

    if (insertError) {
      console.error('Error storing AI analysis:', insertError);
    }

    // Also update the worker monitoring metrics
    const { error: metricsError } = await supabase
      .from('monitoring_alerts')
      .insert({
        alert_type: 'ai_optimization',
        metric_name: 'worker_optimization',
        current_value: 1,
        threshold_value: 1,
        details: {
          optimization_time: new Date().toISOString(),
          ai_recommendations: JSON.parse(data.choices[0].message.content)
        }
      });

    if (metricsError) {
      console.error('Error updating monitoring metrics:', metricsError);
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
