// Store email timestamps in memory (will reset on page refresh, which is fine for basic rate limiting)
const emailSendTimestamps: { [email: string]: number } = {};

// Rate limit configuration (in milliseconds)
const RATE_LIMIT_DURATION = 60 * 1000; // 1 minute

export const canSendEmail = (email: string): boolean => {
  const now = Date.now();
  const lastSent = emailSendTimestamps[email] || 0;
  
  if (now - lastSent > RATE_LIMIT_DURATION) {
    emailSendTimestamps[email] = now;
    return true;
  }
  return false;
};

export const getTimeUntilNextEmail = (email: string): number => {
  const now = Date.now();
  const lastSent = emailSendTimestamps[email] || 0;
  const timeLeft = RATE_LIMIT_DURATION - (now - lastSent);
  return Math.max(0, timeLeft);
};