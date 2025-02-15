
export interface PatternMatch {
  pattern: RegExp;
  type: 'dynamic' | 'element' | 'meta' | 'websocket';
  matched?: string;
}

export interface DetectionDetails {
  matchTypes: {
    dynamic: boolean;
    elements: boolean;
    meta: boolean;
    websockets: boolean;
  };
  matches: Array<{
    type: string;
    pattern: string;
    matched: string;
  }>;
}

