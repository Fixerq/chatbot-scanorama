const EMAIL_RATE_LIMIT_MS = 60000; // 1 minute
const emailSendTimestamps: { [email: string]: number } = {};

export const canSendEmail = (email: string): boolean => {
  const now = Date.now();
  const lastSent = emailSendTimestamps[email] || 0;
  
  if (now - lastSent > EMAIL_RATE_LIMIT_MS) {
    emailSendTimestamps[email] = now;
    return true;
  }
  
  return false;
};