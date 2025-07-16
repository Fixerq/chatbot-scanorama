import { ApifyResult, ApifyBusinessData } from './types.ts';

export function processApifyResults(rawResults: any[]): ApifyResult[] {
  if (!Array.isArray(rawResults)) {
    console.error('Expected array of results, got:', typeof rawResults);
    return [];
  }
  
  console.log(`Processing ${rawResults.length} raw Apify results`);
  
  return rawResults
    .filter(item => item && (item.url || item.website || item.title || item.name))
    .map((item, index) => {
      try {
        return formatApifyResult(item, index);
      } catch (error) {
        console.error('Error processing result item:', error, item);
        return null;
      }
    })
    .filter((result): result is ApifyResult => result !== null);
}

function formatApifyResult(item: any, index: number): ApifyResult {
  // Extract URL - could be in different fields depending on the scraper
  const url = item.url || 
               item.website || 
               item.websiteUrl || 
               item.placeUrl ||
               (item.title ? `https://www.google.com/search?q=${encodeURIComponent(item.title)}` : `https://example.com/business-${index}`);
  
  // Extract business name
  const title = item.title || 
                item.name || 
                item.placeName || 
                item.businessName || 
                'Unknown Business';
  
  // Extract description/address
  const description = item.address || 
                     item.fullAddress || 
                     item.formattedAddress || 
                     item.location || 
                     item.description || 
                     '';
  
  // Extract phone number
  const phone = item.phone || 
                item.phoneNumber || 
                item.internationalPhoneNumber || 
                item.contactPhone || 
                '';
  
  // Extract rating and reviews
  const rating = parseFloat(item.rating || item.stars || 0);
  const reviewCount = parseInt(item.reviewsCount || item.totalReviews || item.numberOfReviews || 0);
  
  // Extract business type/category
  const businessType = item.categoryName || 
                      item.primaryType || 
                      item.category || 
                      item.type || 
                      (item.categories && Array.isArray(item.categories) ? item.categories[0] : '') ||
                      '';
  
  // Extract location information
  const location = item.address || 
                  item.fullAddress || 
                  item.neighborhood || 
                  item.city || 
                  item.region || 
                  '';
  
  // Generate a unique ID
  const id = item.placeId || 
            item.id || 
            item.cid || 
            `apify-${index}-${title.replace(/\s+/g, '-').toLowerCase()}`;
  
  const result: ApifyResult = {
    id: String(id),
    url: url,
    status: 'completed',
    details: {
      title: title,
      description: description,
      phone: phone,
      rating: rating || undefined,
      reviewCount: reviewCount || undefined,
      businessType: businessType,
      location: location,
      lastChecked: new Date().toISOString(),
      chatSolutions: [], // Will be populated by chatbot detection
      confidence: 95, // High confidence for Apify results
      verificationStatus: 'verified'
    }
  };
  
  console.log(`Formatted result ${index + 1}:`, {
    id: result.id,
    title: result.details?.title,
    url: result.url,
    phone: result.details?.phone,
    businessType: result.details?.businessType
  });
  
  return result;
}

// Helper function to extract email if available
function extractEmail(item: any): string {
  return item.email || 
         item.contactEmail || 
         (item.emails && Array.isArray(item.emails) ? item.emails[0] : '') ||
         '';
}

// Helper function to extract social profiles
function extractSocialProfiles(item: any): string[] {
  const profiles: string[] = [];
  
  if (item.facebook) profiles.push(item.facebook);
  if (item.twitter) profiles.push(item.twitter);
  if (item.instagram) profiles.push(item.instagram);
  if (item.linkedin) profiles.push(item.linkedin);
  
  return profiles;
}

// Helper function to normalize business category
function normalizeBusinessCategory(category: string): string {
  if (!category) return '';
  
  const normalized = category.toLowerCase().trim();
  
  // Map common variations to standard categories
  const categoryMappings: Record<string, string> = {
    'restaurant': 'Restaurant',
    'cafe': 'Restaurant',
    'food': 'Restaurant',
    'doctor': 'Healthcare',
    'dentist': 'Healthcare', 
    'medical': 'Healthcare',
    'clinic': 'Healthcare',
    'lawyer': 'Professional Services',
    'attorney': 'Professional Services',
    'accountant': 'Professional Services',
    'real estate': 'Real Estate',
    'realtor': 'Real Estate',
    'auto': 'Automotive',
    'car': 'Automotive',
    'mechanic': 'Automotive',
    'salon': 'Beauty & Wellness',
    'spa': 'Beauty & Wellness',
    'gym': 'Fitness',
    'fitness': 'Fitness',
  };
  
  for (const [key, value] of Object.entries(categoryMappings)) {
    if (normalized.includes(key)) {
      return value;
    }
  }
  
  // Return capitalized original if no mapping found
  return category.charAt(0).toUpperCase() + category.slice(1);
}