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
    console.log('Analyzing URL:', url);
    
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { url }
    });

    if (error) {
      console.error('Error analyzing website:', error);
      throw error;
    }

    console.log('Analysis result:', data);
    
    return {
      status: data.status,
      chatSolutions: data.chatSolutions || [],
      lastChecked: data.lastChecked
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