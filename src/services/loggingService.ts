
export const loggingService = {
  logAnalysisStart: (url: string, attempt: number) => {
    console.log(`Processing URL (attempt ${attempt}):`, url);
  },

  logRequestCreated: (request: any) => {
    console.log('Analysis request created:', request);
  },

  logFunctionInvocation: (url: string, requestId: string) => {
    console.log('Invoking analyze-website function with params:', { url, requestId });
  },

  logPollingStart: () => {
    console.log('Starting polling for analysis status');
  },

  logAnalysisError: (url: string, error: unknown) => {
    console.error(`Error processing ${url}:`, error);
  },

  logRetryAttempt: (url: string, nextAttempt: number) => {
    console.log(`Retrying URL ${url} (attempt ${nextAttempt})`);
  },

  logProcessingError: (error: unknown) => {
    console.error('Error processing URLs:', error);
  },

  logAnalysisCompletion: (result: any) => {
    console.log('Analysis completed successfully:', result);
  },

  logStatusError: (error: unknown) => {
    console.error('Error checking analysis status:', error);
  },

  logInvalidResult: (result: unknown) => {
    console.error('Invalid analysis result format:', result);
  }
};

