export interface ChatDetectionResult {
  status: string;
  chatSolutions: string[];
  lastChecked: string;
}

export interface RequestData {
  url: string;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};