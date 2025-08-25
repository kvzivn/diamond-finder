import fetch from 'node-fetch';
import JSZip from 'jszip';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function testIdexApiCall() {
  console.log('=== TESTING DIRECT IDEX API CALL ===\n');
  
  const IDEX_API_KEY = process.env.IDEX_API_KEY;
  const IDEX_API_SECRET = process.env.IDEX_API_SECRET;
  
  if (!IDEX_API_KEY || !IDEX_API_SECRET) {
    console.log('❌ Missing IDEX API credentials in .env');
    return;
  }
  
  console.log(`✅ API Key: ${IDEX_API_KEY}`);
  console.log(`✅ API Secret: ${IDEX_API_SECRET.substring(0, 10)}...`);
  
  try {
    console.log('\n1. Making API request to IDEX natural diamonds endpoint...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const startTime = Date.now();
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
    const requestTime = Date.now() - startTime;
    
    console.log(`⏱️  Request completed in ${requestTime}ms`);
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    console.log(`📦 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.log(`❌ API request failed: ${response.status}`);
      console.log(`Error body: ${errorBody}`);
      return;
    }
    
    console.log('✅ API request successful!');
    
    console.log('\n2. Extracting ZIP content...');
    
    // Get the response as a buffer
    const zipBuffer = await response.buffer();
    console.log(`📦 ZIP file size: ${zipBuffer.length} bytes`);
    
    if (zipBuffer.length === 0) {
      console.log('❌ Empty ZIP file received!');
      return;
    }
    
    // Extract ZIP
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    const fileList = Object.keys(zipContent.files);
    console.log(`📁 Files in ZIP: ${fileList.length}`);
    fileList.forEach(fileName => {
      console.log(`  - ${fileName}`);
    });
    
    if (fileList.length === 0) {
      console.log('❌ ZIP file contains no files!');
      return;
    }
    
    // Find CSV file
    const csvFileName = fileList.find(name => name.toLowerCase().endsWith('.csv'));
    
    if (!csvFileName) {
      console.log('❌ No CSV file found in ZIP!');
      return;
    }
    
    console.log(`📄 Found CSV file: ${csvFileName}`);
    
    console.log('\n3. Extracting CSV content...');
    
    const csvContent = await zipContent.files[csvFileName].async('text');
    const lines = csvContent.split('\n');
    
    console.log(`📊 CSV lines: ${lines.length}`);
    
    if (lines.length === 0) {
      console.log('❌ Empty CSV file!');
      return;
    }
    
    // Check headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`📝 Headers (${headers.length} total):`);
    
    const priceHeaders = [];
    headers.forEach((header, index) => {
      if (header.toLowerCase().includes('price')) {
        priceHeaders.push({ header, index });
        console.log(`  ${index}: "${header}" (PRICE COLUMN)`);
      } else if (index < 10) {
        console.log(`  ${index}: "${header}"`);
      }
    });
    
    console.log(`\n🏷️  Found ${priceHeaders.length} price-related columns`);
    
    // Check data rows
    let dataRows = 0;
    let rowsWithData = 0;
    
    for (let i = 1; i < Math.min(lines.length, 11); i++) {
      if (lines[i].trim()) {
        dataRows++;
        const values = lines[i].split(',');
        if (values.length > 10) {
          rowsWithData++;
          console.log(`Row ${i}: ${values.length} columns, ItemID="${values[0]}", Carat="${values[3]}", PPC="${values[18]}", Total="${values[19]}"`);
        }
      }
    }
    
    console.log(`\n📈 Data analysis:`);
    console.log(`  Data rows (first 10): ${dataRows}`);
    console.log(`  Rows with sufficient columns: ${rowsWithData}`);
    console.log(`  Total lines in CSV: ${lines.length}`);
    
    if (dataRows === 0) {
      console.log('❌ No data rows found in CSV!');
      console.log('This explains why 0 records were processed.');
    } else {
      console.log(`✅ CSV contains data! Import system should work.`);
    }
    
    // Save a sample for inspection
    const sampleLines = lines.slice(0, 20);
    fs.writeFileSync('/Users/bae/dev/diamond-finder/debug-idex-api-sample.csv', sampleLines.join('\n'));
    console.log(`\n💾 Saved first 20 lines to debug-idex-api-sample.csv`);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Request timed out');
    } else {
      console.error('❌ Error testing IDEX API:', error);
    }
  }
}

testIdexApiCall();