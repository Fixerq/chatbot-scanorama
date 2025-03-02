
// Logging utilities for search operations
export const logSearchParams = (params: any) => {
  console.log('Performing Places search with params:', params);
};

export const logResponse = (data: any) => {
  // Log response size
  const responseSize = JSON.stringify(data).length;
  console.log(`Response size: ${responseSize} bytes`);
  
  // Log count of results
  console.log(`Received ${data?.results?.length || 0} results from API`);
};

export const logEnhancedQuery = (query: string, enhancedQuery: string) => {
  console.log('Original query:', query);
  console.log('Using enhanced search query:', enhancedQuery);
};

export const logRetry = (retryCount: number, retryDelay: number) => {
  console.log(`Retry attempt ${retryCount} with delay ${retryDelay}ms`);
};

export const logRequestTimestamp = (): string => {
  const requestTimestamp = new Date().toISOString();
  console.log(`Request timestamp: ${requestTimestamp}`);
  return requestTimestamp;
};
