import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function quickIdexTest() {
  console.log('=== QUICK IDEX API TEST ===\n');
  
  const IDEX_API_KEY = process.env.IDEX_API_KEY;
  const IDEX_API_SECRET = process.env.IDEX_API_SECRET;
  
  console.log(`API Key: ${IDEX_API_KEY ? 'Present' : 'Missing'}`);
  console.log(`API Secret: ${IDEX_API_SECRET ? 'Present' : 'Missing'}\n`);
  
  try {
    console.log('Making API request...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    const response = await fetch('https://api.idexonline.com/onsite/api/fullfeed', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        authentication_details: {
          api_key: IDEX_API_KEY,
          api_secret: IDEX_API_SECRET,
        },
        parameters: {
          file_format: 'csv',
          data_format: 'format_20230628_extended',
          create_zip_file: true,
        },
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ API request failed: ${response.status}`);
      console.log(`Error body: ${errorText}`);
      return;
    }
    
    const buffer = await response.buffer();
    console.log(`✅ API response received: ${buffer.length} bytes`);
    
    if (buffer.length < 1000) {
      console.log('Response too small, showing content:');
      console.log(buffer.toString());
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Request timed out after 30 seconds');
    } else {
      console.error('❌ Error making API request:', error.message);
    }
  }
}

quickIdexTest();