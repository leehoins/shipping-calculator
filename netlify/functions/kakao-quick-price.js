// Netlify Function for KakaoT Quick Price API
const crypto = require('crypto');
const https = require('https');

// SHA512 서명 생성 함수 (HMAC이 아닌 일반 SHA512)
function generateSignature(timestamp, nonce, apiKey) {
  const data = timestamp + nonce + apiKey;
  return crypto.createHash('sha512').update(data).digest('hex');
}

// Helper function to make HTTPS requests
function httpsRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (e) {
          reject(e);
        }
      });
    });
    
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

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

  // Handle auth check endpoint
  if (event.httpMethod === 'GET' && event.path.includes('auth-check')) {
    try {
      const KAKAO_API_CONFIG = {
        API_KEY: process.env.KAKAO_QUICK_API_KEY || '55cef59b-8544-4733-9b4d-00ebc08736b2',
        VENDOR_ID: process.env.KAKAO_QUICK_VENDOR_ID || 'VZQSH2',
        BASE_URL: 'https://open-api-logistics.kakaomobility.com'
      };

      // HMAC-SHA512 인증 생성
      const timestamp = Date.now().toString();
      const nonce = Math.floor(Math.random() * 1000000).toString();
      const signkey = generateSignature(timestamp, nonce, KAKAO_API_CONFIG.API_KEY);
      const authorization = Buffer.from(`${timestamp}$$${nonce}$$${signkey}`).toString('base64');

      const url = new URL(`${KAKAO_API_CONFIG.BASE_URL}/goa-sandbox-service/api/v1/auth/check`);
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          'Authorization': authorization,
          'vendor': KAKAO_API_CONFIG.VENDOR_ID,
          'Content-Type': 'application/json'
        }
      };

      const response = await httpsRequest(options);
      const data = response.data;
      
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({
          authCheck: data,
          status: response.status,
          debug: {
            timestamp,
            nonce,
            signkey: signkey.substring(0, 20) + '...',
            authorization: authorization.substring(0, 30) + '...',
            apiKey: KAKAO_API_CONFIG.API_KEY.substring(0, 10) + '...'
          }
        })
      };
    } catch (error) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: error.message })
      };
    }
  }

  // Only allow POST for other endpoints
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
      // Sandbox URL - 실제 프로덕션 URL로 변경 필요할 수 있음
      BASE_URL: 'https://open-api-logistics.kakaomobility.com'
    };

    console.log('API Config:', {
      hasApiKey: !!KAKAO_API_CONFIG.API_KEY,
      vendorId: KAKAO_API_CONFIG.VENDOR_ID,
      url: KAKAO_API_CONFIG.BASE_URL
    });

    console.log('Request body:', JSON.stringify(body, null, 2));

    // HMAC-SHA512 인증 생성
    const timestamp = Date.now().toString();
    const nonce = Math.floor(Math.random() * 1000000).toString();
    const signkey = generateSignature(timestamp, nonce, KAKAO_API_CONFIG.API_KEY);
    const authorization = Buffer.from(`${timestamp}$$${nonce}$$${signkey}`).toString('base64');

    console.log('Auth details:', {
      timestamp,
      nonce,
      signkey: signkey.substring(0, 20) + '...',
      authorization: authorization.substring(0, 30) + '...'
    });

    // Make request to KakaoT API
    const url = new URL(`${KAKAO_API_CONFIG.BASE_URL}/goa-sandbox-service/api/v2/orders/price`);
    const postData = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'Authorization': authorization,
        'vendor': KAKAO_API_CONFIG.VENDOR_ID
      }
    };

    const response = await httpsRequest(options, postData);
    const data = response.data;

    if (response.status !== 200) {
      console.error('KakaoT API Error:', data);
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ 
          error: 'KakaoT API Error', 
          details: data,
          status: response.status,
          debug: {
            apiKey: KAKAO_API_CONFIG.API_KEY ? 'Set' : 'Not set',
            vendorId: KAKAO_API_CONFIG.VENDOR_ID,
            requestBody: body
          }
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