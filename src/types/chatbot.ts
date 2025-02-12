
export interface ChatbotDetectionResponse {
  status: string;
  chatSolutions?: string[];
  lastChecked?: string;
  website_url?: string | null;
  business_name?: string | null;
  phone?: string | null;
  address?: string | null;
}
