
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { BatchUpdatePayload, isBatchUpdatePayload } from './types/analysisTypes';

export const useBatchStatusChannel = () => {
  const subscribeToBatchUpdates = (
    batchId: string,
    onComplete: () => void,
    cleanup: () => void
  ) => {
    const channel = supabase
      .channel(`batch-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_batches',
          filter: `id=eq.${batchId}`
        },
        (payload: RealtimePostgresChangesPayload<BatchUpdatePayload>) => {
          console.log('Batch status update:', payload);
          
          if (payload.new && isBatchUpdatePayload(payload.new)) {
            const { status, processed_urls, total_urls } = payload.new;
            console.log(`Batch progress: ${processed_urls}/${total_urls} URLs processed`);
            
            if (status === 'completed') {
              console.log('Batch analysis completed successfully');
              toast.success('Analysis completed!', {
                description: `Processed ${processed_urls} URLs`
              });
              onComplete();
              cleanup();
              channel.unsubscribe();
            } else if (status === 'failed') {
              console.error('Batch analysis failed');
              toast.error('Analysis failed. Please try again.');
              onComplete();
              cleanup();
              channel.unsubscribe();
            }
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  return { subscribeToBatchUpdates };
};
