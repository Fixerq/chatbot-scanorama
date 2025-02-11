
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { BusinessResult } from './types.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function searchBusinessesWithAI(query: string, region: string, country: string): Promise<BusinessResult[]> {
  console.log('Starting AI-powered business search for:', { query, region, country });
  
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  const systemPrompt = `You are a business search expert. Generate detailed business listings for this query.
  For each business provide:
  - Business name
  - Detailed description (2-3 sentences)
  - Website URL if likely to exist
  - Full address including region and country
  - Business type/category
  - Confidence score (0.1-1.0) for how likely this is a real business matching the query
  
  Format as JSON array containing these fields: name, description, website, address, businessType, confidenceScore`;

  const userPrompt = `Find businesses matching: ${query} in ${region}, ${country}. 
  Focus on high-quality, relevant results.
  Return only the JSON array, no other text.`;

  try {
    console.log('Sending request to OpenAI');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Raw OpenAI response:', data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response structure from OpenAI');
    }

    const content = data.choices[0].message.content;
    console.log('Parsing response content:', content);
    
    let results: BusinessResult[];
    try {
      results = JSON.parse(content);
      if (!Array.isArray(results)) {
        throw new Error('Response is not an array');
      }
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate and sanitize each result
    const sanitizedResults = results.map(result => ({
      name: String(result.name || ''),
      description: String(result.description || ''),
      website: result.website ? String(result.website) : undefined,
      address: result.address ? String(result.address) : undefined,
      businessType: result.businessType ? String(result.businessType) : undefined,
      confidenceScore: Number(result.confidenceScore) || 0.1
    }));

    console.log('Processed results:', sanitizedResults);
    return sanitizedResults;
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
}

