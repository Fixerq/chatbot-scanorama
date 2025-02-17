
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { extractValidUrls } from '@/utils/urlValidation';

export async function createAnalysisBatch(results: any[]) {
  const validUrls = extractValidUrls(results);

  if (validUrls.length === 0) {
    throw new Error('No valid business websites found to analyze');
  }

  console.log(`Found ${validUrls.length} valid business URLs to analyze`);

  // Generate a request ID for the batch
  const request_id = crypto.randomUUID();

  // Create a new batch record
  const { data: batchData, error: batchError } = await supabase
    .from('analysis_batches')
    .insert({
      total_urls: validUrls.length,
      processed_urls: 0,
      status: 'pending' as const,
      request_id
    })
    .select()
    .single();

  if (batchError) {
    console.error('Error creating batch:', batchError);
    throw batchError;
  }

  const batchId = batchData.id;
  console.log('Batch analysis started with ID:', batchId);

  // Create analysis requests for each URL
  const requests = validUrls.map(url => ({
    batch_id: batchId,
    url,
    status: 'pending' as const,
    processed: false
  }));

  const { error: requestsError } = await supabase
    .from('analysis_requests')
    .insert(requests);

  if (requestsError) {
    console.error('Error creating analysis requests:', requestsError);
    throw requestsError;
  }

  return { batchId, validUrls };
}
