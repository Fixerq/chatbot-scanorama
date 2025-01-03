import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WappalyzerResponse {
  technologies: Array<{
    name: string;
    categories: Array<{ name: string }>;
  }>;
}

export async function analyzeWithWappalyzer(url: string): Promise<string[]> {
  try {
    const wappalyzerApiKey = Deno.env.get('WAPPALYZER_API_KEY');
    if (!wappalyzerApiKey) {
      console.error('Wappalyzer API key not found');
      return [];
    }

    const response = await fetch('https://api.wappalyzer.com/v2/lookup/', {
      method: 'POST',
      headers: {
        'x-api-key': wappalyzerApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ urls: [url] }),
    });

    if (!response.ok) {
      throw new Error(`Wappalyzer API error: ${response.status}`);
    }

    const data = await response.json() as WappalyzerResponse[];
    if (!data.length || !data[0].technologies) {
      return [];
    }

    return data[0].technologies.map(tech => tech.name);
  } catch (error) {
    console.error('Error analyzing with Wappalyzer:', error);
    return [];
  }
}