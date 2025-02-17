
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
  url?: string;
  error?: string;
  lastChecked?: string;
  details?: {
    patterns?: Array<{
      type: string;
      pattern: string;
      matched: string;
    }>;
    error?: string;
  };
}

function isValidAnalysisResult(payload: any): payload is AnalysisResult {
  return (
    payload &&
    typeof payload.has_chatbot === 'boolean' &&
    Array.isArray(payload.chatSolutions) &&
    typeof payload.status === 'string'
  );
}

export function useAnalysisResultUpdates(batchId: string | null) {
  const subscribeToUpdates = () => {
    if (!batchId) return;

    console.log('Subscribing to analysis results for batch:', batchId);

    const channel = supabase
      .channel(`results-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'analysis_results',
          filter: `batch_id=eq.${batchId}`
        },
        async (payload: RealtimePostgresChangesPayload<AnalysisResult>) => {
          console.log('Analysis result update:', payload);
          
          if (payload.new && isValidAnalysisResult(payload.new)) {
            if (payload.new.error) {
              // Create an alert for analysis errors
              const { error: alertError } = await supabase
                .from('analysis_alerts')
                .insert({
                  url: payload.new.url || '',
                  batch_id: batchId,
                  alert_type: 'analysis_error',
                  alert_message: `Analysis failed for ${payload.new.url}: ${payload.new.error}`,
                  pattern_details: []
                });

              if (alertError) {
                console.error('Error creating error alert:', alertError);
              }

              toast.error(`Analysis failed for ${payload.new.url}`, {
                description: payload.new.error
              });
            } else if (payload.new.has_chatbot) {
              // Create an alert record for chatbot detection
              const { error } = await supabase
                .from('analysis_alerts')
                .insert({
                  url: payload.new.url || '',
                  batch_id: batchId,
                  alert_type: 'chatbot_detected',
                  alert_message: `Chatbot detected on ${payload.new.url || 'website'}`,
                  pattern_details: payload.new.details?.patterns || []
                });

              if (error) {
                console.error('Error creating alert:', error);
              } else {
                const solutions = payload.new.chatSolutions?.length > 0
                  ? `Solutions: ${payload.new.chatSolutions.join(', ')}`
                  : '';

                toast.success("Chatbot Detected!", {
                  description: `URL: ${payload.new.url}\n${solutions}`
                });
              }
            }
          }
        }
      )
      .subscribe();

    // Also subscribe to alerts table to handle showing alerts
    const alertsChannel = supabase
      .channel(`alerts-${batchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'analysis_alerts'
        },
        (payload: RealtimePostgresChangesPayload<any>) => {
          console.log('New alert:', payload);
          // Mark alert as shown
          if (payload.new) {
            supabase
              .from('analysis_alerts')
              .update({ shown: true })
              .eq('id', payload.new.id)
              .then(({ error }) => {
                if (error) {
                  console.error('Error marking alert as shown:', error);
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      console.log('Unsubscribing from analysis results');
      supabase.removeChannel(channel);
      supabase.removeChannel(alertsChannel);
    };
  };

  return { subscribeToUpdates };
}

