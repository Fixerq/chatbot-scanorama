
export const ALLOWED_ORIGINS = [
  'https://detectify.engageai.pro',
  'https://detectifys.engageai.pro'
] as const;

export const originUtils = {
  getPrimary: (): string => window.location.origin || ALLOWED_ORIGINS[0],
  getCurrent: (): string => window.location.origin,
  isValid: (origin: string): boolean => ALLOWED_ORIGINS.includes(origin as any)
};

