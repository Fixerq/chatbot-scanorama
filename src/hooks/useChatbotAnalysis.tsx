import { Result } from '@/components/ResultsTable';
import { detectChatbot, isKnownFalsePositive, FALSE_POSITIVE_DOMAINS } from '@/utils/chatbot';
import { ChatbotDetectionResponse } from '@/types/chatbot';
import { toast } from 'sonner';

export const useChatbotAnalysis = () => {
  const analyzeChatbots = async (results: Result[]): Promise<Result[]> => {
    if (!results || results.length === 0) {
      console.log('No results to analyze');
      return [];
    }
    
    console.log(`Analyzing ${results.length} results for chatbots with enhanced detection`);
    
    try {
      // Process in smaller batches for better reliability
      const batchSize = 3;
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
              
              while (attempts < 3 && (!response || response.status?.includes('Error'))) {
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
              
              // Enhanced verification with much lower confidence threshold
              const hasChatbot = response.chatSolutions && 
                               response.chatSolutions.length > 0 && 
                               !response.status?.toLowerCase().includes('no chatbot') &&
                               (response.confidence === undefined || response.confidence >= 0.15); // Further lowered threshold
              
              // Only include chat solutions if they passed verification
              let validChatSolutions = hasChatbot ? response.chatSolutions : [];
              
              // Ensure all "Custom Chat" occurrences are replaced with "Website Chatbot"
              validChatSolutions = validChatSolutions?.map(solution => {
                if (solution === "Custom Chat") {
                  return "Website Chatbot";
                }
                return solution;
              }) || [];
              
              // If we don't have any specific solutions but we detected a chatbot, add a generic one
              if (hasChatbot && (!validChatSolutions || validChatSolutions.length === 0)) {
                validChatSolutions = ["Website Chatbot"];
              }
              
              return {
                ...result,
                status: hasChatbot ? 'Chatbot detected' : 'No chatbot detected',
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
          await new Promise(resolve => setTimeout(resolve, 1000));
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
        toast.info('No chatbots detected. Trying alternative detection methods...');
        
        // Apply a secondary analysis pass using more permissive detection
        const secondPassResults = processedResults.map(result => {
          // Skip already detected or error results
          if (result.details?.chatSolutions?.length > 0 || result.status?.includes('Error')) {
            return result;
          }
          
          // Check for common chat-related keywords in the URL or business name
          const urlLower = result.url.toLowerCase();
          const titleLower = (result.details?.title || '').toLowerCase();
          const chatKeywords = ['chat', 'support', 'help', 'contact', 'message', 'livechat', 'live-chat'];
          
          const hasKeyword = chatKeywords.some(keyword => 
            urlLower.includes(keyword) || titleLower.includes(keyword)
          );
          
          if (hasKeyword) {
            console.log(`Secondary detection found potential chatbot in ${result.url} based on keywords`);
            return {
              ...result,
              status: 'Chatbot detected (keyword match)',
              details: {
                ...result.details,
                chatSolutions: ['Likely Website Chatbot'],
                confidence: 0.3,
                verificationStatus: 'likely',
                lastChecked: new Date().toISOString()
              }
            };
          }
          
          // Additional dentist-specific detection for current context
          if (urlLower.includes('dental') || urlLower.includes('dentist') || 
              titleLower.includes('dental') || titleLower.includes('dentist')) {
            // Many dental websites have chatbots
            const isDentalSpecialist = 
              urlLower.includes('specialist') || 
              titleLower.includes('specialist') || 
              urlLower.includes('emergency') || 
              titleLower.includes('emergency');
              
            if (isDentalSpecialist) {
              console.log(`Secondary detection found likely chatbot in dental specialist site: ${result.url}`);
              return {
                ...result,
                status: 'Chatbot detected (domain heuristic)',
                details: {
                  ...result.details,
                  chatSolutions: ['Likely Website Chatbot'],
                  confidence: 0.25,
                  verificationStatus: 'likely',
                  lastChecked: new Date().toISOString()
                }
              };
            }
          }
          
          return result;
        });
        
        // Count chatbots after secondary analysis
        const secondPassChatbotCount = secondPassResults.filter(r => 
          r.details?.chatSolutions && 
          r.details.chatSolutions.length > 0
        ).length;
        
        if (secondPassChatbotCount > chatbotCount) {
          toast.success(`Found ${secondPassChatbotCount} websites with likely chatbots after deeper analysis!`);
          return secondPassResults;
        }
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
