
import { useState } from 'react';
import { Result } from '@/components/ResultsTable';
import { detectChatbot } from '@/utils/chatbotDetection';
import { toast } from 'sonner';

export const useUrlProcessor = () => {
  const [results, setResults] = useState<Result[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const processUrls = async (urls: string[]) => {
    setIsProcessing(true);
    const initialResults = urls.map(url => ({
      url,
      status: 'Processing...'
    }));
    setResults(initialResults);

    try {
      const concurrencyLimit = 10;
      const chunks = [];
      for (let i = 0; i < urls.length; i += concurrencyLimit) {
        chunks.push(urls.slice(i, i + concurrencyLimit));
      }

      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (url) => {
          try {
            const chatbotResponse = await detectChatbot(url);
            setResults(prev => prev.map(result => 
              result.url === url ? {
                ...result,
                status: chatbotResponse.status,
                details: {
                  ...result.details,
                  chatSolutions: chatbotResponse.chatSolutions,
                  lastChecked: chatbotResponse.lastChecked
                }
              } : result
            ));
          } catch (error) {
            console.error(`Error processing ${url}:`, error);
            setResults(prev => prev.map(result => 
              result.url === url ? { ...result, status: 'Error analyzing URL' } : result
            ));
          }
        }));
      }

      toast.success('Analysis complete!');
    } catch (error) {
      console.error('Error processing URLs:', error);
      toast.error('Error processing URLs');
    } finally {
      setIsProcessing(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    toast.success('Ready for a new search');
  };

  return {
    results,
    isProcessing,
    processUrls,
    clearResults
  };
};
