// Netlify Function for KakaoT Quick Price API
exports.handler = async (event, context) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // KakaoT Quick API configuration
    const KAKAO_API_CONFIG = {
      API_KEY: process.env.KAKAO_QUICK_API_KEY || '55cef59b-8544-4733-9b4d-00ebc08736b2',
      VENDOR_ID: process.env.KAKAO_QUICK_VENDOR_ID || 'VZQSH2',
      BASE_URL: 'https://open-api-logistics.kakaomobility.com/goa-sandbox-service/api/v2'
    };

    console.log('API Config:', {
      hasApiKey: !!KAKAO_API_CONFIG.API_KEY,
      vendorId: KAKAO_API_CONFIG.VENDOR_ID,
      url: KAKAO_API_CONFIG.BASE_URL
    });

    console.log('Request body:', JSON.stringify(body, null, 2));

    // Make request to KakaoT API
    const response = await fetch(`${KAKAO_API_CONFIG.BASE_URL}/orders/price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': KAKAO_API_CONFIG.API_KEY,
        'vendor': KAKAO_API_CONFIG.VENDOR_ID
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('KakaoT API Error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'KakaoT API Error', 
          details: data,
          status: response.status 
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data)
    };

  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error', 
        message: error.message 
      })
    };
  }
};