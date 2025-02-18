
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

export function useBatchAnalysis() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [completedUrls, setCompletedUrls] = useState<Set<string>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<Record<string, SimplifiedAnalysisResult>>({});

  const analyzeBatch = async (results: any[]) => {
    if (isProcessing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setCompletedUrls(new Set());
    setAnalysisResults({});
    
    try {
      console.log('Starting analysis process for', results.length, 'URLs');
      
      const validUrls = results.filter(r => r.url).map(r => r.url);
      
      if (!validUrls.length) {
        throw new Error('No valid URLs to analyze');
      }

      console.log('Validated URLs:', validUrls);

      const { data: insertedRecords, error: insertError } = await supabase
        .from('simplified_analysis_results')
        .insert(
          validUrls.map(url => ({
            url,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        )
        .select();

      if (insertError) {
        console.error('Error inserting records:', insertError);
        throw insertError;
      }

      console.log('Created analysis records:', insertedRecords);

      // Set initial state with pending records
      if (insertedRecords) {
        const initialState = insertedRecords.reduce((acc, record) => {
          acc[record.url] = record;
          return acc;
        }, {} as Record<string, SimplifiedAnalysisResult>);
        setAnalysisResults(initialState);
      }

      // Call the analyze-website function
      const { data, error } = await supabase.functions.invoke('analyze-website', {
        body: {
          urls: validUrls,
          isBatch: true,
          retry: true
        }
      });

      if (error) {
        console.error('Error response from analyze-website:', error);
        throw new Error(`Analysis failed: ${error.message}`);
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
            
            if (payload.eventType === 'DELETE') return;
            
            const newData = payload.new;
            if (!newData) return;
            
            // Update results state immediately
            setAnalysisResults(prev => ({
              ...prev,
              [newData.url]: {
                ...newData,
                status: newData.status || 'pending',
                has_chatbot: newData.has_chatbot || false,
                chatbot_solutions: newData.chatbot_solutions || []
              }
            }));

            // Track completed URLs
            if (newData.status === 'completed' || newData.error) {
              setCompletedUrls(prev => {
                const updated = new Set(prev);
                updated.add(newData.url);
                
                // Update progress
                const progressValue = Math.round((updated.size / validUrls.length) * 100);
                setProgress(progressValue);
                
                // Check if all URLs are processed
                if (updated.size === validUrls.length) {
                  console.log('All URLs processed');
                  setIsProcessing(false);
                  
                  const chatbotCount = Object.values(analysisResults)
                    .filter(result => result.has_chatbot).length;

                  toast.success(`Analysis completed for ${validUrls.length} URLs`, {
                    description: `Found ${chatbotCount} chatbots`
                  });
                  
                  channel.unsubscribe();
                }
                
                return updated;
              });
            }
          }
        )
        .subscribe();

      return {
        cleanup: () => {
          channel.unsubscribe();
          setIsProcessing(false);
          setCompletedUrls(new Set());
          setAnalysisResults({});
        },
        results: analysisResults
      };

    } catch (error) {
      console.error('Analysis error:', error);
      setIsProcessing(false);
      setCompletedUrls(new Set());
      setAnalysisResults({});
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process websites';
      toast.error(errorMessage);
      throw error;
    }
  };

  return {
    analyzeBatch,
    isProcessing,
    progress,
    completedUrls: Array.from(completedUrls),
    results: analysisResults
  };
}
