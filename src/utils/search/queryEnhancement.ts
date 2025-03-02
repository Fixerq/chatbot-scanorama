
export const enhanceSearchQuery = (query: string, country: string, region: string): string => {
  // Create a more reliable search query by adding the region/country if not already in query
  let enhancedQuery = query;
  if (region && !query.toLowerCase().includes(region.toLowerCase())) {
    enhancedQuery = `${query} ${region}`;
  }
  if (country && !query.toLowerCase().includes(country.toLowerCase())) {
    enhancedQuery = `${enhancedQuery} ${country}`;
  }
  return enhancedQuery;
};
