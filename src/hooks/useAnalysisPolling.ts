
import { useState, useCallback } from 'react';
import { checkAnalysisStatus } from '@/services/analysisService';
import { ANALYSIS_CONSTANTS } from '@/types/analysis';
import { Result } from '@/components/ResultsTable';
import { isChatDetectionResult } from '@/types/chatbot';
import { loggingService } from '@/services/loggingService';

export const useAnalysisPolling = (
  updateResults: (url: string, update: Partial<Result>) => void
) => {
  const [attempts, setAttempts] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const checkStatus = useCallback(async (requestId: string, url: string): Promise<boolean> => {
    try {
      const request = await checkAnalysisStatus(requestId);
      
      if (!request) {
        updateResults(url, { status: 'Error: Analysis request not found' });
        return true;
      }

      if (request.status === 'completed' && request.analysis_result) {
        const result = request.analysis_result;
        if (isChatDetectionResult(result)) {
          loggingService.logAnalysisCompletion(result);
          updateResults(url, {
            status: 'success',
            details: {
              chatSolutions: result.chatSolutions || [],
              lastChecked: new Date().toISOString()
            }
          });
          return true;
        } else {
          loggingService.logInvalidResult(result);
          updateResults(url, { status: 'Error: Invalid analysis result format' });
          return true;
        }
      } else if (request.status === 'failed') {
        const errorMessage = request.error_message || 'Analysis failed';
        const retryInfo = request.retry_count < request.max_retries 
          ? ` (Retry ${request.retry_count + 1}/${request.max_retries})` 
          : ' (Max retries reached)';
        
        loggingService.logAnalysisError(url, request.error_message);
        updateResults(url, { 
          status: `Error: ${errorMessage}${retryInfo}`,
          details: {
            lastChecked: new Date().toISOString()
          }
        });
        
        return request.retry_count >= request.max_retries;
      } else if (request.status === 'processing') {
        updateResults(url, { 
          status: 'processing',
          isAnalyzing: true 
        });
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error checking analysis status:', error);
      loggingService.logStatusError(error);
      updateResults(url, { 
        status: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isAnalyzing: false 
      });
      return true;
    }
  }, [updateResults]);

  const startPolling = useCallback(async (requestId: string, url: string) => {
    if (isPolling) return;
    
    setIsPolling(true);
    setAttempts(0);

    const poll = async () => {
      if (attempts >= ANALYSIS_CONSTANTS.MAX_POLLING_ATTEMPTS) {
        console.error('Analysis timeout reached');
        updateResults(url, { 
          status: 'Error: Analysis timeout',
          isAnalyzing: false 
        });
        setIsPolling(false);
        return;
      }

      const isComplete = await checkStatus(requestId, url);
      if (!isComplete) {
        setAttempts(prev => prev + 1);
        setTimeout(() => poll(), ANALYSIS_CONSTANTS.POLLING_INTERVAL);
      } else {
        setIsPolling(false);
      }
    };

    await poll();
  }, [attempts, checkStatus, updateResults, isPolling]);

  return { startPolling };
};
