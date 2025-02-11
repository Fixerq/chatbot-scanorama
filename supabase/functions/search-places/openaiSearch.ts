
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

export async function searchBusinessesWithAI(query: string, region: string, country: string): Promise<Array<{
  name: string;
  description: string;
  website?: string;
  address?: string;
  businessType?: string;
  confidenceScore: number;
}>> {
  console.log('Starting AI-powered business search for:', { query, region, country });
  
  if (!OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }
  
  const systemPrompt = `You are a business search expert. Generate business matches for this query.
  For each business provide:
  - Business name
  - Brief description (1-2 sentences)
  - Website URL if you can reasonably guess it
  - Full address including region and country
  - Business type/category
  - Confidence score (0.1-1.0) for how confident you are this is a real business matching the query
  
  Format as JSON array with these fields: name, description, website, address, businessType, confidenceScore`;

  const userPrompt = `Find businesses matching: ${query} in ${region}, ${country}. Return 3-5 relevant results.
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
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      console.error('No content in OpenAI response');
      throw new Error('No content in OpenAI response');
    }

    console.log('Raw OpenAI response:', content);
    
    // Safely parse the JSON response
    let results;
    try {
      results = JSON.parse(content);
      if (!Array.isArray(results)) {
        throw new Error('Response is not an array');
      }
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid response format from OpenAI');
    }
    
    // Validate and sanitize results
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
    console.error('Error in AI search:', error);
    throw error;
  }
}
