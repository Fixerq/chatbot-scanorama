
import Papa from 'papaparse';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { ChatbotDetectionResponse } from '@/types/chatbot';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

export const detectChatbot = async (url: string): Promise<ChatbotDetectionResponse> => {
  try {
    if (!url) {
      console.error('No URL provided');
      throw new Error('URL is required');
    }

    const cleanUrl = url.trim();
    if (!cleanUrl) {
      throw new Error('URL cannot be empty');
    }

    console.log('Analyzing URL:', cleanUrl);
    
    const bodyData = { url: cleanUrl };
    console.log('Request body:', bodyData);

    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: JSON.stringify(bodyData),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    });

    if (error) {
      console.error('Error analyzing website:', error);
      return {
        status: `Error: ${error.message || 'Failed to analyze website'}`,
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }

    console.log('Analysis result:', data);
    
    return {
      status: data.status,
      chatSolutions: data.chatSolutions || [],
      lastChecked: data.lastChecked,
      website_url: data.website_url,
      business_name: data.business_name
    };
  } catch (error) {
    console.error('Error in detectChatbot:', error);
    return {
      status: 'Error analyzing URL',
      chatSolutions: [],
      lastChecked: new Date().toISOString()
    };
  }
};

export const processCSV = (content: string): string[] => {
  const results = Papa.parse(content, { header: true });
  const urls: string[] = [];
  
  if (results.data && Array.isArray(results.data)) {
    results.data.forEach((row: any) => {
      const urlValue = row.url || row.URL || row.Website || row.website || Object.values(row)[0];
      if (urlValue && typeof urlValue === 'string') {
        const cleanUrl = urlValue.trim();
        if (isValidUrl(cleanUrl)) {
          urls.push(cleanUrl);
        }
      }
    });
  }
  
  return urls;
};

export const exportToCSV = (results: Result[]): void => {
  const csv = Papa.unparse(results);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', 'chatbot-analysis.csv');
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
