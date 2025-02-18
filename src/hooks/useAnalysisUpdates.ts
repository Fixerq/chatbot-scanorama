
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export function useAnalysisUpdates(
  url: string | null,
  onProgress: (progress: number) => void,
  onComplete: () => void
) {
  useEffect(() => {
    if (!url) return;

    console.log('Setting up analysis updates for URL:', url);

    const channel = supabase
      .channel(`analysis-${url}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results',
          filter: `url=eq.${url}`
        },
        (payload: { new: SimplifiedAnalysisResult }) => {
          console.log('Analysis update received:', payload);
          
          if (payload.new) {
            // Calculate progress
            if (payload.new.status === 'completed') {
              onProgress(100);
              onComplete();
            } else if (payload.new.status === 'processing') {
              onProgress(50);
            }

            if (payload.new.error) {
              console.error(`Analysis failed for ${url}:`, payload.new.error);
            }
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Cleaning up analysis updates subscription');
      supabase.removeChannel(channel);
    };
  }, [url, onProgress, onComplete]);

  const subscribeToUpdates = () => {
    return () => {};
  };

  return { subscribeToUpdates };
}
