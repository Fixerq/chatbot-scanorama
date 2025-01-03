import { Json } from '@/integrations/supabase/types';

export interface AnalysisResult {
  status: string;
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    platform?: string;
  };
  technologies: string[];
}

export interface CachedResult {
  url: string;
  status: string;
  details: Json;
  technologies: string[];
  created_at: string;
}

export interface ParsedCachedResult extends Omit<CachedResult, 'details'> {
  details: {
    chatSolutions?: string[];
    errorDetails?: string;
    lastChecked?: string;
    platform?: string;
  };
}