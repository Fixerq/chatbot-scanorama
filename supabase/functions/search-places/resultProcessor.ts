
import { countryDomains } from './config';

export function processResults(mappedResults: any[], countryCode: string) {
  // Filter out directories, gov sites, edu sites, etc.
  const nonServiceKeywords = [
    'directory', 'listing', 'yellow pages', 'whitepages', 'yelp', 'finder',
    'government', 'gov', 'council', 'department', 'authority', 'agency',
    'university', 'education', 'school', 'college', 'academy', 'institute',
    'wikipedia', 'wiki', 'encyclopedia', 'dictionary',
    'news', 'magazine', 'blog', 'forum', 'review site'
  ];
  
  // Filter out non-service businesses based on URL and title
  let serviceResults = mappedResults.filter(result => {
    const url = result.url.toLowerCase();
    const title = result.title.toLowerCase();
    
    const isNonService = nonServiceKeywords.some(keyword => 
      url.includes(keyword) || title.includes(keyword)
    );
    
    const isUnwantedDomain = url.includes('.gov') || 
                            url.includes('.edu') || 
                            url.includes('yelp.com') ||
                            url.includes('yellowpages') ||
                            url.includes('directory.com') ||
                            url.includes('whitepages.com') ||
                            url.includes('yell.com') ||
                            url.includes('trulia.com') ||
                            url.includes('tripadvisor') ||
                            url.includes('booking.com');
    
    return !isNonService && !isUnwantedDomain;
  });
  
  console.log(`Filtered out ${mappedResults.length - serviceResults.length} non-service results`);
  
  // Filter based on country-specific domains if appropriate
  let filteredResults = serviceResults;
  
  if (countryCode && countryDomains[countryCode]) {
    console.log(`Applying domain filtering for country: ${countryCode}`);
    
    const preferredDomains = countryDomains[countryCode];
    const otherCountryDomains = Object.entries(countryDomains)
      .filter(([code]) => code !== countryCode)
      .flatMap(([_, domains]) => domains);
    
    let preferredDomainCount = 0;
    let otherDomainCount = 0;
    let neutralDomainCount = 0;
    
    filteredResults = serviceResults.filter(result => {
      const url = result.url.toLowerCase();
      const hasPreferredDomain = preferredDomains.some(domain => url.includes(domain));
      const hasOtherCountryDomain = otherCountryDomains.some(domain => url.includes(domain));
      
      if (hasPreferredDomain) preferredDomainCount++;
      else if (hasOtherCountryDomain) otherDomainCount++;
      else neutralDomainCount++;
      
      return hasPreferredDomain || !hasOtherCountryDomain;
    });
    
    console.log(`Domain filtering stats: preferred=${preferredDomainCount}, neutral=${neutralDomainCount}, other=${otherDomainCount}`);
    console.log(`Results after domain filtering: ${filteredResults.length}`);
    
    if (filteredResults.length < 10) {
      console.log('Too few results after filtering, adding back neutral domains');
      filteredResults = serviceResults.filter(result => {
        const url = result.url.toLowerCase();
        const hasPreferredDomain = preferredDomains.some(domain => url.includes(domain));
        const hasOtherCountryDomain = otherCountryDomains.some(domain => url.includes(domain));
        
        return hasPreferredDomain || !hasOtherCountryDomain;
      });
    }
  }
  
  return filteredResults;
}
