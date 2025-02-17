
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface AnalysisResult {
  has_chatbot: boolean;
  chatSolutions: string[];
  status: string;
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
        async (payload) => {
          console.log('Analysis result update:', payload);
          
          if (payload.new && isValidAnalysisResult(payload.new)) {
            if (payload.new.has_chatbot) {
              // Create an alert record
              const { error } = await supabase
                .from('analysis_alerts')
                .insert({
                  url: payload.new.url,
                  batch_id: batchId,
                  alert_type: 'chatbot_detected',
                  alert_message: `Chatbot detected on ${payload.new.url}`,
                  pattern_details: payload.new.details?.patterns || [],
                });

              if (error) {
                console.error('Error creating alert:', error);
              } else {
                // Show toast with more details
                toast.success(
                  <div className="space-y-2">
                    <h3 className="font-semibold">Chatbot Detected!</h3>
                    <p className="text-sm">URL: {payload.new.url}</p>
                    {payload.new.chatSolutions?.length > 0 && (
                      <p className="text-sm text-gray-600">
                        Solutions: {payload.new.chatSolutions.join(', ')}
                      </p>
                    )}
                  </div>
                );
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
        (payload) => {
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
      supabase.removeChannel(channel);
      supabase.removeChannel(alertsChannel);
    };
  };

  return { subscribeToUpdates };
}
