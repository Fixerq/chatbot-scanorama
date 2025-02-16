
import { ChatDetectionResult } from '../types.ts';

const BATCH_SIZE = 3; // Reduced from previous value to prevent resource exhaustion
const BATCH_DELAY = 1000; // 1 second delay between batches

export async function processBatch<T>(
  items: T[],
  processFn: (item: T) => Promise<ChatDetectionResult>,
  onProgress?: (result: ChatDetectionResult, index: number) => Promise<void>
): Promise<ChatDetectionResult[]> {
  const results: ChatDetectionResult[] = [];
  
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
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
        return {
          has_chatbot: false,
          chatSolutions: [],
          error: error.message,
          details: {},
          lastChecked: new Date().toISOString()
        };
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    if (i + BATCH_SIZE < items.length) {
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  return results;
}
