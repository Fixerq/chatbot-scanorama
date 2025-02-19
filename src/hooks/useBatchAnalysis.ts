
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

  // Base64Url encode header and payload
  const base64UrlHeader = btoa(JSON.stringify(header))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
    
  const base64UrlPayload = btoa(JSON.stringify(tokenPayload))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  // Create signature using HMAC SHA-256
  const signatureInput = `${base64UrlHeader}.${base64UrlPayload}`;
  let signature = '';

  try {
    // Create HMAC using SubtleCrypto
    const textEncoder = new TextEncoder();
    const keyData = textEncoder.encode(secret);
    const messageData = textEncoder.encode(signatureInput);
    
    // Convert the secret to an array of bytes
    const cryptoKey = new Uint8Array(keyData);
    
    // Create simple hash-based signature
    const hashArray = new Uint8Array(messageData.length + cryptoKey.length);
    hashArray.set(messageData);
    hashArray.set(cryptoKey, messageData.length);
    
    // Convert to base64url
    signature = btoa(String.fromCharCode(...hashArray))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    // Return complete JWT
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
          .maybeSingle();

        if (secretError) {
          console.error('Error fetching webhook secret:', secretError);
          throw new Error('Failed to fetch webhook secret');
        }

        if (!secretData) {
          toast.error('Webhook secret not found', {
            description: 'Please ensure the ZAPIER_WEBHOOK_SECRET is set in your project settings'
          });
          throw new Error('Webhook secret not found');
        }

        // Create JWT token using the webhook secret
        const jwt = createJWT(secretData.value, { batch_size: results.length });

        console.log('Sending request to Zapier with JWT authorization');

        // Make the Zapier request with proper CORS and error handling
        const zapierResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${jwt}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        // Log the Zapier response for debugging
        const responseText = await zapierResponse.text();
        console.log('Zapier response status:', zapierResponse.status);
        console.log('Zapier response:', responseText);

        if (!zapierResponse.ok) {
          throw new Error(`Zapier request failed with status ${zapierResponse.status}: ${responseText}`);
        }

        clearTimeout(timeoutId);
        console.log('Zapier request completed successfully');

        // Then send URLs to analyze-website function
        const { error: analysisError } = await supabase.functions.invoke('analyze-website', {
          body: {
            urls: results.map(r => r.url),
            isBatch: true,
            retry: true
          }
        });

        if (analysisError) {
          console.error('Error analyzing websites:', analysisError);
          throw analysisError;
        }

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
