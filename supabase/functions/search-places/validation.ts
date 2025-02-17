
interface SearchRequest {
  query: string;
  country: string;
  region?: string;
}

export function validateSearchRequest(params: SearchRequest): string | null {
  if (!params.query || typeof params.query !== 'string' || params.query.trim().length === 0) {
    return 'Search query is required';
  }

  if (!params.country || typeof params.country !== 'string' || params.country.trim().length === 0) {
    return 'Country is required';
  }

  // Region is optional but must be a string if provided
  if (params.region && typeof params.region !== 'string') {
    return 'Region must be a string';
  }

  return null;
}
