
import { supabase } from '../utils/supabaseClient.ts';
import { websiteAnalyzer } from './websiteAnalyzer.ts';
import { ChatDetectionResult } from '../types.ts';

interface Job {
  id: string;
  url: string;
  retry_count: number;
}

export async function processNextJob(): Promise<void> {
  try {
    // Get next available job
    const { data: job, error: jobError } = await supabase
      .rpc('get_next_job')
      .single();

    if (jobError || !job) {
      console.log('[JobProcessor] No jobs available or error:', jobError?.message || 'No jobs in queue');
      return;
    }

    console.log(`[JobProcessor] Started processing job ${job.id} for URL: ${job.url}`);

    try {
      // Process the URL
      const result = await websiteAnalyzer(job.url);
      
      console.log(`[JobProcessor] Analysis completed for job ${job.id}. Updating status...`);

      // Update job with success result
      await supabase
        .from('analysis_jobs')
        .update({
          status: 'completed',
          result,
          completed_at: new Date().toISOString(),
          metadata: {
            ...result.details,
            completedAt: new Date().toISOString()
          }
        })
        .eq('id', job.id);

      console.log(`[JobProcessor] Successfully completed job ${job.id}`);
    } catch (analysisError) {
      console.error(`[JobProcessor] Error processing job ${job.id}:`, analysisError);

      // Increment retry count and potentially mark as failed
      const newRetryCount = (job.retry_count || 0) + 1;
      const status = newRetryCount >= 3 ? 'failed' : 'pending';

      await supabase
        .from('analysis_jobs')
        .update({
          status,
          error: analysisError.message,
          retry_count: newRetryCount,
          completed_at: status === 'failed' ? new Date().toISOString() : null
        })
        .eq('id', job.id);
    }
  } catch (error) {
    console.error('[JobProcessor] Unexpected error:', error);
    throw error;
  }
}
