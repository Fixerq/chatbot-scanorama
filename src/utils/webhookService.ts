
export const sendWebhookData = async (data: any) => {
  console.log('Attempting to send webhook data:', data);
  
  const webhookUrl = 'https://hooks.zapier.com/hooks/catch/2694924/2wqea0g/';
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error('Webhook error response:', responseText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.text();
    console.log('Webhook response:', responseData);
    
    return true;
  } catch (error) {
    console.error('Webhook error:', error);
    throw error;
  }
};
