
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
  
  const systemPrompt = `You are a business search expert. Generate likely business matches for the user's query. 
  Focus on businesses that would have websites and be interested in customer service technology.
  For each business, provide:
  - Business name
  - Description
  - Likely website URL (based on business name)
  - Full address
  - Business type/category
  - Confidence score (0.0-1.0) indicating how likely this business is to be real and match the query
  
  Format your response as a JSON array of objects with these exact fields:
  name, description, website, address, businessType, confidenceScore`;

  const userPrompt = `Find businesses matching: ${query} in ${region}, ${country}
  Return only the JSON array, no other text.`;

  try {
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
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get response from OpenAI');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content in OpenAI response');
    }

    console.log('Received AI response:', content);
    
    // Parse the JSON response
    const results = JSON.parse(content);
    
    console.log('Parsed AI results:', results);
    return results;
  } catch (error) {
    console.error('Error in AI search:', error);
    throw error;
  }
}
