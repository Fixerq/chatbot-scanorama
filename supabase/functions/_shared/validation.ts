// Input validation utilities for edge functions

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];
  
  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

// Sanitize string input to prevent XSS and injection attacks
export function sanitizeString(input: unknown): string {
  if (typeof input !== 'string') {
    throw new ValidationException([{ field: 'input', message: 'Expected string input' }]);
  }
  
  // Remove potentially dangerous characters and normalize
  return input
    .trim()
    .replace(/[<>'"&]/g, '') // Remove HTML/XML special chars
    .replace(/[{}]/g, '') // Remove object notation
    .slice(0, 1000); // Limit length
}

// Validate URL input
export function validateUrl(url: unknown, fieldName = 'url'): string {
  if (typeof url !== 'string') {
    throw new ValidationException([{ field: fieldName, message: 'URL must be a string' }]);
  }
  
  const sanitized = sanitizeString(url);
  
  if (!sanitized) {
    throw new ValidationException([{ field: fieldName, message: 'URL cannot be empty' }]);
  }
  
  try {
    const urlObj = new URL(sanitized.startsWith('http') ? sanitized : `https://${sanitized}`);
    
    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new ValidationException([{ field: fieldName, message: 'Only HTTP/HTTPS URLs are allowed' }]);
    }
    
    return urlObj.toString();
  } catch {
    throw new ValidationException([{ field: fieldName, message: 'Invalid URL format' }]);
  }
}

// Validate array of URLs
export function validateUrlArray(urls: unknown, fieldName = 'urls'): string[] {
  if (!Array.isArray(urls)) {
    throw new ValidationException([{ field: fieldName, message: 'Expected array of URLs' }]);
  }
  
  if (urls.length === 0) {
    throw new ValidationException([{ field: fieldName, message: 'URL array cannot be empty' }]);
  }
  
  if (urls.length > 100) {
    throw new ValidationException([{ field: fieldName, message: 'Too many URLs (max 100)' }]);
  }
  
  return urls.map((url, index) => validateUrl(url, `${fieldName}[${index}]`));
}

// Validate numeric input
export function validateNumber(
  input: unknown, 
  fieldName: string, 
  min?: number, 
  max?: number
): number {
  const num = Number(input);
  
  if (isNaN(num)) {
    throw new ValidationException([{ field: fieldName, message: 'Must be a valid number' }]);
  }
  
  if (min !== undefined && num < min) {
    throw new ValidationException([{ field: fieldName, message: `Must be at least ${min}` }]);
  }
  
  if (max !== undefined && num > max) {
    throw new ValidationException([{ field: fieldName, message: `Must be at most ${max}` }]);
  }
  
  return num;
}

// Validate boolean input
export function validateBoolean(input: unknown, fieldName: string): boolean {
  if (typeof input === 'boolean') {
    return input;
  }
  
  if (typeof input === 'string') {
    const lower = input.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;
  }
  
  throw new ValidationException([{ field: fieldName, message: 'Must be a boolean value' }]);
}

// Validate search query
export function validateSearchQuery(query: unknown): string {
  if (typeof query !== 'string') {
    throw new ValidationException([{ field: 'query', message: 'Search query must be a string' }]);
  }
  
  const sanitized = sanitizeString(query);
  
  if (!sanitized || sanitized.length < 2) {
    throw new ValidationException([{ field: 'query', message: 'Search query must be at least 2 characters' }]);
  }
  
  if (sanitized.length > 200) {
    throw new ValidationException([{ field: 'query', message: 'Search query too long (max 200 characters)' }]);
  }
  
  return sanitized;
}

// Validate country code
export function validateCountryCode(country: unknown): string {
  if (typeof country !== 'string') {
    throw new ValidationException([{ field: 'country', message: 'Country must be a string' }]);
  }
  
  const sanitized = sanitizeString(country).toUpperCase();
  
  if (!/^[A-Z]{2}$/.test(sanitized)) {
    throw new ValidationException([{ field: 'country', message: 'Country must be a valid 2-letter code' }]);
  }
  
  return sanitized;
}

// Create validation error response
export function createValidationErrorResponse(error: ValidationException) {
  return new Response(
    JSON.stringify({
      error: 'Validation failed',
      details: error.errors,
      status: 'validation_error'
    }),
    {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      }
    }
  );
}

// Rate limiting check (basic implementation)
export function checkRateLimit(userAgent: string | null, ip: string | null): boolean {
  // In a production environment, you'd implement proper rate limiting
  // with Redis or database storage. This is a basic check.
  
  // Allow requests without headers (browsers may not always send these)
  if (!userAgent && !ip) {
    return true; // Allow if both are missing (likely from browser)
  }
  
  // Block suspicious user agents only if we have a user agent
  if (userAgent) {
    const suspiciousPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i
    ];
    
    if (suspiciousPatterns.some(pattern => pattern.test(userAgent))) {
      return false;
    }
  }
  
  return true; // Allow by default
}