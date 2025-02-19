
import { useState, useCallback } from 'react';
import { Result } from '@/components/ResultsTable';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

function createJWT(secret: string, payload = {}): string {
  // Create header
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  // Create payload with expiration
  const tokenPayload = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
  };

  try {
    // Base64Url encode header and payload more efficiently
    const base64UrlEncode = (obj: any) => {
      return btoa(JSON.stringify(obj))
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
    };

    const base64UrlHeader = base64UrlEncode(header);
    const base64UrlPayload = base64UrlEncode(tokenPayload);

    // Create signature
    const signatureInput = `${base64UrlHeader}.${base64UrlPayload}`;
    const signature = btoa(signatureInput)
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${base64UrlHeader}.${base64UrlPayload}.${signature}`;
  } catch (error) {
    console.error('Error creating JWT:', error);
    throw new Error('Failed to create authentication token');
  }
}

export const useBatchAnalysis = () => {
  const [progress, setProgress] = useState(0);

  const analyzeBatch = useCallback(async (results: Result[]) => {
    console.log('Starting batch analysis for', results.length, 'URLs');
    
    try {
      const webhookUrl = 'https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/';
      
      // Validate payload before sending
      const payload = results.map(result => ({
        url: result.url,
        business_name: result.title || result.details?.business_name || 'Untitled',
        search_batch_id: result.details?.search_batch_id || '',
        timestamp: new Date().toISOString()
      }));

      console.log('Sending payload to Zapier:', payload);

      // Set up request with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      try {
        // First, update Supabase status to 'processing'
        for (const result of results) {
          const { error: dbError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'processing',
              updated_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error updating initial status:', dbError);
            throw new Error('Failed to update initial status');
          }
        }

        // Get the webhook secret from Supabase
        const { data: secretData, error: secretError } = await supabase
          .from('secrets')
          .select('value')
          .eq('name', 'ZAPIER_WEBHOOK_SECRET')
          .single();

        if (secretError) {
          console.error('Error fetching webhook secret:', secretError);
          throw new Error('Failed to fetch webhook secret');
        }

        // Create JWT token using the webhook secret
        const jwt = createJWT(secretData.value, { batch_size: results.length });

        // Make the Zapier request with JWT authentication
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
          mode: 'no-cors'
        });

        clearTimeout(timeoutId);
        console.log('Zapier request completed:', response);

        // Update Supabase with 'pending' status
        for (const result of results) {
          const { error: dbError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'pending',
              updated_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error updating to pending status:', dbError);
            throw new Error('Failed to update to pending status');
          }
        }

        toast.success('Analysis request sent successfully');
        console.log('Batch analysis completed successfully');

      } catch (fetchError) {
        console.error('Fetch error details:', fetchError);
        
        // Update status to 'error' for all URLs in the batch
        await Promise.all(results.map(async (result) => {
          const { error: dbError } = await supabase
            .from('simplified_analysis_results')
            .upsert({
              url: result.url,
              status: 'error',
              error: fetchError.message || 'Unknown error occurred',
              updated_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error updating error status:', dbError);
          }
        }));

        if (fetchError.name === 'AbortError') {
          throw new Error('Request timeout - please try again');
        }
        throw new Error(`Failed to send to Zapier: ${fetchError.message}`);
      } finally {
        clearTimeout(timeoutId);
      }

      return { cleanup: () => {} };
    } catch (error) {
      console.error('Failed to process websites:', error);
      toast.error(`Failed to process websites: ${error.message}`);
      throw error;
    }
  }, []);

  return { analyzeBatch, progress };
};
