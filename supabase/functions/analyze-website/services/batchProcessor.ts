
import { corsHeaders } from '../_shared/cors.ts';
import { supabase } from '../utils/supabaseClient.ts';
import { Website, AnalysisResult } from '../types.ts';
import { analyzeWebsite } from '../services/websiteAnalyzer.ts';

const BATCH_SIZE = 10; // Process 10 sites at a time
const BATCH_INTERVAL = 10000; // 10 seconds between batches

export async function processBatch(batchId: string, urls: string[]) {
  console.log(`Starting batch processing for batch ${batchId} with ${urls.length} URLs`);
  
  try {
    let processedCount = 0;
    
    // Process URLs in chunks of BATCH_SIZE
    for (let i = 0; i < urls.length; i += BATCH_SIZE) {
      const chunk = urls.slice(i, i + BATCH_SIZE);
      console.log(`Processing chunk of ${chunk.length} URLs`);
      
      // Process all URLs in the chunk concurrently
      const analysisPromises = chunk.map(async (url) => {
        try {
          console.log(`Analyzing URL: ${url}`);
          const result = await analyzeWebsite(url);
          
          // Update the analysis result in the database
          const { error: updateError } = await supabase
            .from('analysis_results')
            .upsert({
              url,
              batch_id: batchId,
              analysis_result: result,
              status: 'completed',
              analyzed_at: new Date().toISOString()
            });

          if (updateError) {
            console.error(`Error updating analysis result for ${url}:`, updateError);
            throw updateError;
          }

          processedCount++;
          
          // Update batch progress
          const { error: batchError } = await supabase
            .from('analysis_batches')
            .update({ 
              processed_urls: processedCount,
              status: processedCount === urls.length ? 'completed' : 'processing'
            })
            .eq('id', batchId);

          if (batchError) {
            console.error(`Error updating batch progress:`, batchError);
            throw batchError;
          }

          return result;
        } catch (error) {
          console.error(`Error analyzing ${url}:`, error);
          
          // Update the failed analysis in the database
          await supabase
            .from('analysis_results')
            .upsert({
              url,
              batch_id: batchId,
              status: 'error',
              error: error.message,
              analyzed_at: new Date().toISOString()
            });
            
          return null;
        }
      });

      // Wait for all URLs in the chunk to be processed
      await Promise.all(analysisPromises);
      
      // If there are more URLs to process, wait for the batch interval
      if (i + BATCH_SIZE < urls.length) {
        console.log(`Waiting ${BATCH_INTERVAL}ms before processing next chunk`);
        await new Promise(resolve => setTimeout(resolve, BATCH_INTERVAL));
      }
    }

    console.log(`Batch ${batchId} processing completed`);
    
    // Update final batch status
    await supabase
      .from('analysis_batches')
      .update({ 
        status: 'completed',
        processed_urls: urls.length
      })
      .eq('id', batchId);

  } catch (error) {
    console.error(`Error processing batch ${batchId}:`, error);
    
    // Update batch status to failed
    await supabase
      .from('analysis_batches')
      .update({ 
        status: 'failed',
        error_message: error.message
      })
      .eq('id', batchId);
      
    throw error;
  }
}
