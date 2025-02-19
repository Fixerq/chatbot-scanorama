
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useBatchAnalysis = () => {
  const [progress, setProgress] = useState(0);

  const analyzeBatch = useCallback(async (results: Result[]) => {
    console.log('Starting batch analysis for', results.length, 'URLs');
    
    try {
      // Send data to Zapier webhook
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/';
      
      // Format the payload for Zapier
      const payload = results.map(result => ({
        url: result.url,
        business_name: result.title || result.details?.business_name || 'Untitled',
        search_batch_id: result.details?.search_batch_id || '',
        timestamp: new Date().toISOString()
      }));

      console.log('Sending payload to Zapier:', payload);
      
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Failed to send data to Zapier: ${response.status}`);
      }

      // Wait for Zapier's response
      const zapierResponse = await response.json();
      console.log('Received response from Zapier:', zapierResponse);

      // Update results with Zapier's analysis
      if (Array.isArray(zapierResponse)) {
        for (const analysisResult of zapierResponse) {
          const { url, has_chatbot, chatbot_solutions, error } = analysisResult;
          
          // Update the simplified_analysis_results table
          const { error: dbError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url,
              has_chatbot,
              chatbot_solutions: chatbot_solutions || [],
              status: error ? 'error' : 'completed',
              error: error || null,
              updated_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error updating analysis results:', dbError);
            throw dbError;
          }
        }
      }

      toast.success('Analysis completed successfully');
      return { cleanup: () => {} };
    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error('Failed to process websites');
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
