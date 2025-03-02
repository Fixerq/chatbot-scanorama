
import { Result } from '@/components/ResultsTable';

/**
 * Uses keyword and domain-specific heuristics to detect possible chatbots
 * that might have been missed by primary detection methods
 */
export const performSecondaryDetection = (results: Result[]): Result[] => {
  return results.map(result => {
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
};
