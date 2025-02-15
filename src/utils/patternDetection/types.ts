
export interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
  confidence?: number;
  category?: string;
  subcategory?: string;
}

export interface MatchType {
  dynamic: boolean;
  elements: boolean;
  meta: boolean;
  websockets: boolean;
}

export interface PatternMatchResult {
  type: string;
  pattern: string;
  matched?: string;
  confidence?: number;
  category?: string;
  subcategory?: string;
}

export interface DetectionDetails {
  matchTypes: MatchType;
  matches: PatternMatchResult[];
}

