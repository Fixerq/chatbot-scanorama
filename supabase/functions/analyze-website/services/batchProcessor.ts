
import { ChatDetectionResult } from '../types.ts';

const BATCH_SIZE = 2; // Further reduced to prevent resource exhaustion
const BATCH_DELAY = 2000; // Increased delay between batches to 2 seconds
const MAX_RETRIES = 3;

export async function processBatch<T>(
  items: T[],
  processFn: (item: T) => Promise<ChatDetectionResult>,
  onProgress?: (result: ChatDetectionResult, index: number) => Promise<void>
): Promise<ChatDetectionResult[]> {
  const results: ChatDetectionResult[] = [];
  let retryCount = 0;
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    try {
      console.log(`[BatchProcessor] Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(items.length / BATCH_SIZE)}`);
      
      const batch = items.slice(i, i + BATCH_SIZE);
      const batchPromises = batch.map(async (item, batchIndex) => {
        try {
          const result = await processFn(item);
          if (onProgress) {
            await onProgress(result, i + batchIndex);
          }
          return result;
        } catch (error) {
          console.error('[BatchProcessor] Error processing item:', error);
          // Return a failed result instead of throwing
          return {
            has_chatbot: false,
            chatSolutions: [],
            error: error.message || 'Unknown error occurred',
            details: {
              error: error.message,
              errorType: error.name || 'ProcessingError'
            },
            lastChecked: new Date().toISOString()
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Reset retry count after successful batch
      retryCount = 0;

      // Add delay between batches, but only if there are more items to process
      if (i + BATCH_SIZE < items.length) {
        console.log(`[BatchProcessor] Waiting ${BATCH_DELAY}ms before next batch`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    } catch (error) {
      console.error(`[BatchProcessor] Batch error at index ${i}:`, error);
      
      // Implement retry logic
      if (retryCount < MAX_RETRIES) {
        console.log(`[BatchProcessor] Retrying batch (attempt ${retryCount + 1} of ${MAX_RETRIES})`);
        i -= BATCH_SIZE; // Retry the same batch
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY * (retryCount + 1))); // Exponential backoff
        continue;
      }
      
      // If max retries reached, continue with next batch but log the error
      console.error(`[BatchProcessor] Max retries reached for batch at index ${i}`);
      const failedResults = batch.map(() => ({
        has_chatbot: false,
        chatSolutions: [],
        error: 'Max retries exceeded',
        details: {
          error: error.message,
          errorType: 'BatchProcessingError'
        },
        lastChecked: new Date().toISOString()
      }));
      results.push(...failedResults);
    }
  }

  console.log(`[BatchProcessor] Completed processing ${results.length} items`);
  return results;
}
