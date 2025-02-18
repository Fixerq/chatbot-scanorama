
import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeBatch = async (results: any[]) => {
    if (isProcessing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    
    try {
      console.log('Starting analysis process for', results.length, 'URLs');
      
      // Extract valid URLs
      const validUrls = results.filter(r => r.url).map(r => r.url);
      
      if (!validUrls.length) {
        throw new Error('No valid URLs to analyze');
      }

      // Insert initial records for each URL
      const { data: insertedRecords, error: insertError } = await supabase
        .from('simplified_analysis_results')
        .insert(
          validUrls.map(url => ({
            url,
            status: 'pending'
          }))
        )
        .select();

      if (insertError) {
        throw insertError;
      }

      console.log('Created analysis records:', insertedRecords);

      // Call the analyze-website function
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: { 
          urls: validUrls,
          retry: true
        }
      });

      if (error) {
        console.error('Error initiating analysis:', error);
        throw error;
      }

      console.log('Analysis initiated successfully:', data);
      
      // Set up subscription to monitor status updates
      const channel = supabase
        .channel('analysis-updates')
        .on<SimplifiedAnalysisResult>(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'simplified_analysis_results',
            filter: `url=in.(${validUrls.map(url => `'${url}'`).join(',')})`
          },
          (payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
            console.log('Analysis update received:', payload);
            
            if (payload.new && Object.keys(payload.new).length > 0) {
              // Calculate progress based on completed analyses
              const completedCount = validUrls.length;
              const newProgress = Math.round((completedCount / validUrls.length) * 100);
              setProgress(newProgress);

              if (payload.new.error) {
                toast.error(`Analysis failed for ${payload.new.url}`, {
                  description: payload.new.error
                });
              } else if (payload.new.has_chatbot) {
                toast.success(`Chatbot detected on ${payload.new.url}`, {
                  description: payload.new.chatbot_solutions?.join(', ')
                });
              }

              // Check if all URLs are processed
              if (newProgress === 100) {
                console.log('All URLs processed');
                setIsProcessing(false);
                channel.unsubscribe();
              }
            }
          }
        )
        .subscribe();

      return {
        cleanup: () => {
          channel.unsubscribe();
          setIsProcessing(false);
        },
        results: data?.results
      };

    } catch (error) {
      console.error('Analysis error:', error);
      setIsProcessing(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process websites';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress
  };
}
