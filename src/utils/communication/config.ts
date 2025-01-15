export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro',
  'http://localhost:3000'
] as const;

export const originUtils = {
  getPrimary: (): string => ALLOWED_ORIGINS[0],
  getCurrent: (): string => window.location.origin,
  isValid: (origin: string): boolean => ALLOWED_ORIGINS.includes(origin as any)
};