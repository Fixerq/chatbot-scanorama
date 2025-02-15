
export function logPatternMatch(type: string, pattern: RegExp, matchedContent: string | undefined): void {
  console.log(`[PatternDetection] ${type} pattern matched:`, {
    pattern: pattern.toString(),
    matchedContent: matchedContent || 'No match content'
  });
}

