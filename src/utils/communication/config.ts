
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovableproject.com',
  'https://d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://id-preview--d261f35a-a484-4323-82d8-e28223e9f6af.lovable.app',
  'https://cfelpyucqllkshmlkwxz.supabase.co',
  'http://localhost:8080',
  'http://localhost:3000'
] as const;

export const originUtils = {
  getPrimary: (): string => window.location.origin || ALLOWED_ORIGINS[0],
  getCurrent: (): string => window.location.origin,
  isValid: (origin: string): boolean => ALLOWED_ORIGINS.includes(origin as any)
};

