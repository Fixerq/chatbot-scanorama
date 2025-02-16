
import { ChatDetectionResult } from '../types.ts';

const BATCH_SIZE = 1; // Process one URL at a time
const BATCH_DELAY = 3000; // Increased delay to 3 seconds
const MAX_RETRIES = 2;
const COOLDOWN_PERIOD = 5000; // Add a cooldown period between retries

export async function processBatch<T>(
  items: T[],
  processFn: (item: T) => Promise<ChatDetectionResult>,
  onProgress?: (result: ChatDetectionResult, index: number) => Promise<void>
): Promise<ChatDetectionResult[]> {
  const results: ChatDetectionResult[] = [];
  let retryCount = 0;
  let lastProcessTime = Date.now();
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    try {
      console.log(`[BatchProcessor] Processing item ${i + 1} of ${items.length}`);
      
      // Ensure minimum time between processing
      const timeSinceLastProcess = Date.now() - lastProcessTime;
      if (timeSinceLastProcess < BATCH_DELAY) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY - timeSinceLastProcess));
      }
      
      const item = items[i];
      try {
        const result = await processFn(item);
        if (onProgress) {
          await onProgress(result, i);
        }
        results.push(result);
        lastProcessTime = Date.now();
        retryCount = 0; // Reset retry count after successful processing
      } catch (error) {
        console.error('[BatchProcessor] Error processing item:', error);
        results.push({
          has_chatbot: false,
          chatSolutions: [],
          error: error.message || 'Unknown error occurred',
          details: {
            error: error.message,
            errorType: error.name || 'ProcessingError'
          },
          lastChecked: new Date().toISOString()
        });
      }

      // Add delay between items
      if (i + BATCH_SIZE < items.length) {
        console.log(`[BatchProcessor] Waiting ${BATCH_DELAY}ms before next item`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    } catch (error) {
      console.error(`[BatchProcessor] Batch error at index ${i}:`, error);
      
      if (retryCount < MAX_RETRIES) {
        console.log(`[BatchProcessor] Retrying item (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        i -= BATCH_SIZE; // Retry the same item
        retryCount++;
        
        // Add exponential backoff with cooldown period
        const cooldownTime = COOLDOWN_PERIOD * Math.pow(2, retryCount - 1);
        console.log(`[BatchProcessor] Cooling down for ${cooldownTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, cooldownTime));
        continue;
      }
      
      console.error(`[BatchProcessor] Max retries reached for item at index ${i}`);
      results.push({
        has_chatbot: false,
        chatSolutions: [],
        error: 'Max retries exceeded',
        details: {
          error: error.message,
          errorType: 'BatchProcessingError'
        },
        lastChecked: new Date().toISOString()
      });
    }
  }

  console.log(`[BatchProcessor] Completed processing ${results.length} items`);
  return results;
}
