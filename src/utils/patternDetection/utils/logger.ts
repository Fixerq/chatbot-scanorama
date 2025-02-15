
export const logPatternMatch = (type: string, pattern: RegExp, matched?: string, details?: { 
  confidence?: number;
  category?: string;
  subcategory?: string;
}) => {
  console.log('[PatternDetection] Pattern matched:', {
    type,
    pattern: pattern.toString(),
    matched,
    ...details
  });
};

