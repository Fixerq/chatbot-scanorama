
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { performSecondaryDetection } from '@/utils/chatbot/secondaryDetection';

/**
 * Performs tertiary level analysis after primary and secondary detection
 * to determine if any chatbots were detected
 */
export const performTertiaryAnalysis = (results: Result[]): { updatedResults: Result[], chatbotCount: number } => {
  // Count chatbots after primary analysis
  const chatbotCount = results.filter(r => 
    r.details?.chatSolutions && 
    r.details.chatSolutions.length > 0
  ).length;
  
  if (chatbotCount > 0) {
    toast.success(`Found ${chatbotCount} websites with verified chatbots!`);
    return { updatedResults: results, chatbotCount };
  } else {
    toast.info('No chatbots detected. Trying alternative detection methods...');
    
    // Apply a secondary analysis pass using more permissive detection
    const secondPassResults = performSecondaryDetection(results);
    
    // Count chatbots after secondary analysis
    const secondPassChatbotCount = secondPassResults.filter(r => 
      r.details?.chatSolutions && 
      r.details.chatSolutions.length > 0
    ).length;
    
    if (secondPassChatbotCount > chatbotCount) {
      toast.success(`Found ${secondPassChatbotCount} websites with likely chatbots after deeper analysis!`);
    }
    
    return { updatedResults: secondPassResults, chatbotCount: secondPassChatbotCount };
  }
};
