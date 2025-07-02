// Security audit helpers for ongoing monitoring

export interface SecurityCheckResult {
  id: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityAuditReport {
  timestamp: string;
  overall: 'pass' | 'warning' | 'fail';
  checks: SecurityCheckResult[];
}

export class SecurityAuditor {
  private checks: SecurityCheckResult[] = [];

  // Add a security check result
  addCheck(
    id: string, 
    status: 'pass' | 'warning' | 'fail', 
    message: string, 
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) {
    this.checks.push({ id, status, message, severity });
  }

  // Generate audit report
  generateReport(): SecurityAuditReport {
    const failedChecks = this.checks.filter(c => c.status === 'fail');
    const warningChecks = this.checks.filter(c => c.status === 'warning');
    
    let overall: 'pass' | 'warning' | 'fail' = 'pass';
    
    if (failedChecks.length > 0) {
      overall = 'fail';
    } else if (warningChecks.length > 0) {
      overall = 'warning';
    }

    return {
      timestamp: new Date().toISOString(),
      overall,
      checks: this.checks
    };
  }

  // Clear all checks (for fresh audit)
  reset() {
    this.checks = [];
  }
}

// Utility function to sanitize user input in the frontend
export function sanitizeInput(input: string, maxLength = 1000): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>'"&{}]/g, '') // Remove potentially dangerous chars
    .slice(0, maxLength); // Limit length
}

// Utility to check if URL is from allowed domains (if needed)
export function isAllowedDomain(url: string, allowedDomains: string[]): boolean {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    return allowedDomains.some(allowed => 
      domain === allowed.toLowerCase() || 
      domain.endsWith('.' + allowed.toLowerCase())
    );
  } catch {
    return false;
  }
}

// Rate limiting helper for client-side
export class ClientRateLimit {
  private attempts: Map<string, number[]> = new Map();
  
  constructor(
    private maxAttempts: number = 10, 
    private windowMs: number = 60000 // 1 minute
  ) {}
  
  canMakeRequest(key: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.attempts.has(key)) {
      this.attempts.set(key, [now]);
      return true;
    }
    
    const keyAttempts = this.attempts.get(key)!;
    // Remove old attempts outside the window
    const validAttempts = keyAttempts.filter(time => time > windowStart);
    
    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }
    
    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }
  
  reset(key?: string) {
    if (key) {
      this.attempts.delete(key);
    } else {
      this.attempts.clear();
    }
  }
}