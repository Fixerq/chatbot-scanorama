
export const formatAnalysisStatus = (status?: string, isAnalyzing?: boolean) => {
  if (isAnalyzing) return 'Analyzing...';
  if (!status) return 'Queued';
  return status;
};

export const formatChatbotProviders = (solutions?: string[]) => {
  if (!solutions || solutions.length === 0) return 'No chatbot detected';
  return solutions.join(', ');
};

export const getBusinessName = (url: string, businessName?: string): string => {
  if (businessName) return businessName;
  
  try {
    const domain = new URL(url).hostname
      .replace('www.', '')
      .replace(/\.(com|net|org|io|co|uk|au).*$/, '');
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return url;
  }
};
