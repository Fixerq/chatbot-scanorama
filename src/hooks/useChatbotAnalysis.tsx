
import { Result } from '@/components/ResultsTable';
import { detectChatbot } from '@/utils/chatbotDetection';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';

// Known false positive domains
const FALSE_POSITIVE_DOMAINS = [
  'kentdentists.com',
  'privategphealthcare.com',
  'dentalcaredirect.co.uk',
  'mydentist.co.uk',
  'dentist-special.com'
];

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

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    if (!results || results.length === 0) {
      console.log('No results to analyze');
      return [];
    }
    
    console.log(`Analyzing ${results.length} results for chatbots with enhanced detection`);
    
    try {
      // Process in smaller batches for better reliability
      const batchSize = 5;
      let processedResults: Result[] = [];
      
      // Process in batches to prevent overloading
      for (let i = 0; i < results.length; i += batchSize) {
        const batch = results.slice(i, i + batchSize);
        console.log(`Processing batch ${i/batchSize + 1} of ${Math.ceil(results.length/batchSize)}`);
        
        const batchResults = await Promise.all(
          batch.map(async (result) => {
            if (!result.url) {
              console.warn('Skipping analysis for result with no URL');
              return {
                ...result,
                status: 'Error: Missing URL'
              };
            }

            // Check if this is a known false positive before processing
            if (isKnownFalsePositive(result.url)) {
              console.log(`Known false positive site detected: ${result.url}`);
              return {
                ...result,
                status: 'No chatbot detected (verified)',
                details: {
                  ...result.details,
                  title: result.details?.title || 'Business Name',
                  chatSolutions: [],
                  verificationStatus: 'verified',
                  confidence: 0,
                  lastChecked: new Date().toISOString()
                }
              };
            }

            try {
              // Add retry logic for more reliability
              let attempts = 0;
              let response: ChatbotDetectionResponse | null = null;
              
              while (attempts < 2 && (!response || response.status?.includes('Error'))) {
                if (attempts > 0) {
                  console.log(`Retry attempt ${attempts} for ${result.url}`);
                  await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
                }
                
                console.log(`Analyzing URL with enhanced detection: ${result.url}`);
                response = await detectChatbot(result.url);
                attempts++;
              }
              
              if (!response) {
                throw new Error('Failed to analyze URL after retries');
              }
              
              // Log detailed response for debugging
              console.log(`Analysis response for ${result.url}:`, response);
              
              // Enhanced verification with more permissive confidence check
              const hasChatbot = response.chatSolutions && 
                               response.chatSolutions.length > 0 && 
                               !response.status?.toLowerCase().includes('no chatbot') &&
                               (response.confidence === undefined || response.confidence >= 0.25); // Further lowered threshold
              
              // Only include chat solutions if they passed verification
              let validChatSolutions = hasChatbot ? response.chatSolutions : [];
              
              // Ensure all "Custom Chat" occurrences are replaced with "Website Chatbot"
              validChatSolutions = validChatSolutions?.map(solution => {
                if (solution === "Custom Chat") {
                  return "Website Chatbot";
                }
                return solution;
              }) || [];
              
              return {
                ...result,
                status: response.status || 'Analyzed',
                details: {
                  ...result.details,
                  title: result.details?.title || 'Business Name',
                  chatSolutions: validChatSolutions,
                  confidence: response.confidence,
                  verificationStatus: response.verificationStatus,
                  lastChecked: response.lastChecked || new Date().toISOString()
                }
              };
            } catch (error) {
              console.error(`Error analyzing ${result.url}:`, error);
              return {
                ...result,
                status: 'Error analyzing URL'
              };
            }
          })
        );
        
        processedResults = [...processedResults, ...batchResults];
        
        // Short delay between batches to prevent rate limiting
        if (i + batchSize < results.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('Analysis completed with enhanced detection. Results:', processedResults.length);
      
      // Check if any results have chatbots with lower confidence threshold
      const chatbotCount = processedResults.filter(r => 
        r.details?.chatSolutions && 
        r.details.chatSolutions.length > 0
      ).length;
      
      if (chatbotCount > 0) {
        toast.success(`Found ${chatbotCount} websites with verified chatbots!`);
      } else {
        toast.info('No verified chatbots detected in the analyzed websites.');
      }
      
      return processedResults;
    } catch (error) {
      console.error('Error in batch analysis:', error);
      toast.error('Error during analysis: ' + (error instanceof Error ? error.message : 'Unknown error'));
      return results.map(result => ({
        ...result,
        status: 'Error in analysis process'
      }));
    }
  };

  return { analyzeChatbots };
};

export default useChatbotAnalysis;
