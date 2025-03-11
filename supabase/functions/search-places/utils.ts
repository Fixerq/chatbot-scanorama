
import { countryCodeMap } from './config.ts';

// Helper functions
export function normalizeCountryCode(country: string): string {
  return countryCodeMap[country] || country;
}

export function buildFieldMask(fields: string[] = []): string {
  return fields.join(',');
}

// Function to get major cities for a region
export function getMajorCities(country: string, region: string): string[] | null {
  const cities = {
    'AU': {
      'Western Australia': ['Perth', 'Fremantle', 'Mandurah', 'Bunbury', 'Geraldton', 'Albany', 'Kalgoorlie'],
      'Victoria': ['Melbourne', 'Geelong', 'Ballarat', 'Bendigo', 'Shepparton', 'Mildura', 'Warrnambool'],
      'New South Wales': ['Sydney', 'Newcastle', 'Wollongong', 'Central Coast', 'Coffs Harbour', 'Wagga Wagga'],
      'Queensland': ['Brisbane', 'Gold Coast', 'Sunshine Coast', 'Cairns', 'Townsville', 'Toowoomba', 'Mackay'],
      'South Australia': ['Adelaide', 'Mount Gambier', 'Whyalla', 'Port Lincoln', 'Port Augusta', 'Victor Harbor'],
      'Tasmania': ['Hobart', 'Launceston', 'Devonport', 'Burnie'],
      'Northern Territory': ['Darwin', 'Alice Springs', 'Katherine'],
      'Australian Capital Territory': ['Canberra', 'Queanbeyan']
    },
    'US': {
      'California': ['Los Angeles', 'San Francisco', 'San Diego', 'Sacramento', 'San Jose', 'Fresno'],
      'New York': ['New York City', 'Buffalo', 'Rochester', 'Syracuse', 'Albany'],
      'Texas': ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso'],
      'Florida': ['Miami', 'Orlando', 'Tampa', 'Jacksonville', 'Fort Lauderdale'],
      'Connecticut': ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury']
    },
    'GB': {
      'England': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Leeds', 'Bristol', 'Newcastle'],
      'Scotland': ['Edinburgh', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness'],
      'Wales': ['Cardiff', 'Swansea', 'Newport', 'Bangor'],
      'Northern Ireland': ['Belfast', 'Derry', 'Newry', 'Armagh']
    }
  };
  
  const countryCode = normalizeCountryCode(country);
  
  if (cities[countryCode] && cities[countryCode][region]) {
    return cities[countryCode][region];
  }
  
  return null;
}
