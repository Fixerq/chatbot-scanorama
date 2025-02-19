
export const sendWebhookData = async (data: any) => {
  console.log('Attempting to send webhook data:', data);
  
  try {
    const response = await fetch('https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    console.log('Webhook response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
};
