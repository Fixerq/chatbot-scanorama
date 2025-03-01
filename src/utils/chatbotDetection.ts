
import Papa from 'papaparse';
import { Result } from '@/components/ResultsTable';
import { supabase } from '@/integrations/supabase/client';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';

// Known false positives that should be excluded
const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com'
];

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : `https://${url}`);
    return true;
  } catch {
    return false;
  }
};

// Check if a domain is in our false positives list
const isKnownFalsePositive = (url: string): boolean => {
  try {
    const domain = new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
    return FALSE_POSITIVE_DOMAINS.some(falsePositive => 
      domain.includes(falsePositive) || domain === falsePositive
    );
  } catch {
    return false;
  }
};

export const detectChatbot = async (url: string): Promise<ChatbotDetectionResponse> => {
  try {
    console.log('Analyzing URL:', url);
    
    if (!url || url.trim() === '') {
      console.error('Empty URL provided to detectChatbot');
      return {
        status: 'Error: Empty URL',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    // Check if this is a known false positive before even making the request
    if (isKnownFalsePositive(url)) {
      console.log('Known false positive site detected:', url);
      return {
        status: 'No chatbot detected (verified)',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    // Format the URL properly if needed
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    console.log('Formatted URL for analysis:', formattedUrl);
    
    // Call the Supabase edge function with enhanced verification options
    const { data, error } = await supabase.functions.invoke('analyze-website', {
      body: { 
        urls: [formattedUrl],
        debug: true,
        verifyResults: true,
        deepVerification: true,
        smartDetection: true, // Enable the new smart detection capabilities
        confidenceThreshold: 0.5, // Lowered from 0.75 to improve detection rates
        checkFunctionality: true // Verify if chat functionality actually exists
      }
    });

    if (error) {
      console.error('Error analyzing website:', error);
      toast.error('Error analyzing website: ' + error.message);
      
      return {
        status: 'Error analyzing URL',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }

    console.log('Analysis result from edge function with enhanced verification:', data);

    // Check if data is an array (new format) or object (old format)
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      
      // More lenient confidence checking
      if (!result.hasChatbot || 
         (result.confidence && result.confidence < 0.5) || // Lowered from 0.75
         (result.verificationStatus === 'failed')) {
        console.log(`No chatbot detected or verification failed (${result.confidence}), marking as no chatbot`);
        return {
          status: 'No chatbot detected',
          chatSolutions: [],
          confidence: result.confidence || 0,
          verificationStatus: result.verificationStatus || 'unknown',
          lastChecked: new Date().toISOString()
        };
      }
      
      // Map generic "Custom Chat" to more descriptive labels
      let solutions = result.solutions || [];
      
      // Convert all "Custom Chat" instances to the more descriptive label
      solutions = solutions.map(solution => 
        solution === "Custom Chat" ? "Website Chatbot" : solution
      );
      
      return {
        status: result.status || 'Analyzed',
        chatSolutions: solutions,
        confidence: result.confidence || 1,
        verificationStatus: result.verificationStatus || 'verified',
        lastChecked: new Date().toISOString()
      };
    }
    
    if (!data || !data.status) {
      console.warn('Edge function returned incomplete data');
      return {
        status: 'Analysis completed with no results',
        chatSolutions: [],
        lastChecked: new Date().toISOString()
      };
    }
    
    return {
      status: data.status,
      chatSolutions: data.chatSolutions || [],
      confidence: data.confidence || 0,
      verificationStatus: data.verificationStatus || 'unknown',
      lastChecked: data.lastChecked || new Date().toISOString()
    };
  } catch (error) {
    console.error('Error in detectChatbot:', error);
    toast.error('Failed to analyze website: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
