
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Database } from '@/integrations/supabase/types';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type SimplifiedAnalysisResult = Database['public']['Tables']['simplified_analysis_results']['Row'];

interface AnalysisState {
  results: Record<string, SimplifiedAnalysisResult>;
  isProcessing: boolean;
  progress: number;
  completedUrls: Set<string>;
}

export const useAnalysis = () => {
  const [state, setState] = useState<AnalysisState>({
    results: {},
    isProcessing: false,
    progress: 0,
    completedUrls: new Set()
  });

  const handleAnalysisUpdate = useCallback((payload: RealtimePostgresChangesPayload<SimplifiedAnalysisResult>) => {
    console.log('Received analysis update:', payload);
    
    if (payload.eventType === 'DELETE') {
      setState(prev => {
        const { [payload.old?.url || '']: _, ...rest } = prev.results;
        return { ...prev, results: rest };
      });
      return;
    }

    const newData = payload.new;
    if (!newData) return;

    setState(prev => {
      const updatedResults = {
        ...prev.results,
        [newData.url]: {
          ...newData,
          status: newData.status || 'pending',
          has_chatbot: newData.has_chatbot || false,
          chatbot_solutions: newData.chatbot_solutions || []
        }
      };

      const completedUrls = new Set(prev.completedUrls);
      if (newData.status === 'completed' || newData.status === 'failed') {
        completedUrls.add(newData.url);
      }

      // Show toast notifications based on status
      if (newData.status === 'completed') {
        if (newData.has_chatbot) {
          toast.success(`Chatbot detected on ${newData.url}`, {
            description: newData.chatbot_solutions?.join(', ')
          });
        } else {
          toast.info(`No chatbot detected on ${newData.url}`);
        }
      } else if (newData.status === 'failed') {
        toast.error(`Analysis failed for ${newData.url}`, {
          description: newData.error || 'Unknown error'
        });
      }

      const totalUrls = Object.keys(updatedResults).length;
      const progress = totalUrls > 0 ? Math.round((completedUrls.size / totalUrls) * 100) : 0;
      const isProcessing = completedUrls.size < totalUrls;

      return {
        results: updatedResults,
        completedUrls,
        progress,
        isProcessing
      };
    });
  }, []);

  const subscribeToAnalysisResults = useCallback(() => {
    console.log('Setting up analysis results subscription');
    
    const channel = supabase
      .channel('analysis-updates')
      .on<SimplifiedAnalysisResult>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'simplified_analysis_results'
        },
        handleAnalysisUpdate
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Cleaning up analysis results subscription');
      supabase.removeChannel(channel);
    };
  }, [handleAnalysisUpdate]);

  const analyzeBatch = useCallback(async (urls: string[]) => {
    if (state.isProcessing) {
      console.log('Analysis already in progress, skipping...');
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true, progress: 0, completedUrls: new Set() }));
    
    try {
      console.log('Starting analysis process for', urls.length, 'URLs');
      
      if (!urls.length) {
        throw new Error('No valid URLs to analyze');
      }

      // Create initial records for all URLs
      const { data: initialRecords, error: initError } = await supabase
        .from('simplified_analysis_results')
        .upsert(
          urls.map(url => ({
            url,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        )
        .select();

      if (initError) {
        console.error('Error initializing analysis:', initError);
        throw initError;
      }

      // Set initial state with pending records
      if (initialRecords) {
        setState(prev => ({
          ...prev,
          results: initialRecords.reduce((acc, record) => {
            acc[record.url] = record;
            return acc;
          }, {} as Record<string, SimplifiedAnalysisResult>)
        }));
      }

      // Call the analyze-website function
      const { error } = await supabase.functions.invoke('analyze-website', {
        body: {
          urls,
          isBatch: true,
          retry: true
        }
      });

      if (error) {
        console.error('Error analyzing websites:', error);
        throw error;
      }

      console.log('Analysis initiated successfully');
    } catch (error) {
      console.error('Failed to analyze websites:', error);
      setState(prev => ({ ...prev, isProcessing: false }));
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to process websites';
      toast.error(errorMessage);
      throw error;
    }
  }, [state.isProcessing]);

  const analyzeUrl = useCallback(async (url: string) => {
    return analyzeBatch([url]);
  }, [analyzeBatch]);

  useEffect(() => {
    const cleanup = subscribeToAnalysisResults();
    return cleanup;
  }, [subscribeToAnalysisResults]);

  return {
    results: state.results,
    isProcessing: state.isProcessing,
    progress: state.progress,
    completedUrls: Array.from(state.completedUrls),
    analyzeUrl,
    analyzeBatch
  };
};
