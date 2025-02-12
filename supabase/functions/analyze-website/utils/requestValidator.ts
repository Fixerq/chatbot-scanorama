
import { RequestData } from '../types.ts';

export function validateRequest(rawBody: string): RequestData {
  console.log('Validating request body:', rawBody);
  
  // Check for empty or whitespace-only body
  if (!rawBody || rawBody.trim() === '') {
    console.error('Empty request body received');
    throw new Error('Request body cannot be empty');
  }

  let requestData: RequestData;
  try {
    requestData = JSON.parse(rawBody);
    console.log('Parsed request data:', requestData);
  } catch (error) {
    console.error('JSON parsing error:', error);
    throw new Error(`Invalid JSON in request body: ${error.message}`);
  }

  if (!requestData || typeof requestData !== 'object') {
    console.error('Invalid request data format:', requestData);
    throw new Error('Request body must be a valid JSON object');
  }

  if (!requestData.url) {
    console.error('Missing URL in request:', requestData);
    throw new Error('URL is required in request body');
  }

  if (typeof requestData.url !== 'string') {
    console.error('Invalid URL type in request:', typeof requestData.url);
    throw new Error('URL must be a string');
  }

  return requestData;
}
