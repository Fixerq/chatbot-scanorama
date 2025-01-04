import { Result } from '@/components/ResultsTable';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const GOOGLE_CX = import.meta.env.VITE_GOOGLE_CX;

interface GoogleSearchResult {
  items: Array<{
    link: string;
    title: string;
    snippet: string;
  }>;
}

export const performGoogleSearch = async (
  query: string,
  country: string,
  region: string,
  startIndex: number = 1
): Promise<{ results: Result[]; hasMore: boolean }> => {
  const locationQuery = region ? `${query} in ${region}, ${country}` : `${query} in ${country}`;
  
  console.log('Performing Google search with query:', locationQuery);
  
  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CX}&q=${encodeURIComponent(locationQuery)}&start=${startIndex}`
    );

    if (!response.ok) {
      throw new Error('Search API request failed');
    }

    const data: GoogleSearchResult = await response.json();
    
    const results: Result[] = data.items.map(item => ({
      url: item.link,
      status: 'Processing...',
      details: {
        title: item.title,
        description: item.snippet
      }
    }));

    return {
      results,
      hasMore: data.items && data.items.length === 10 // Google returns max 10 results per page
    };
  } catch (error) {
    console.error('Google search error:', error);
    throw error;
  }
}