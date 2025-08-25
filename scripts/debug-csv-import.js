import fetch from 'node-fetch';
import JSZip from 'jszip';
import dotenv from 'dotenv';

dotenv.config();

// Copy the header mappings from the service
const NATURAL_DIAMOND_HEADERS = [
  'Item ID #',
  'Supplier Stock Ref.',
  'Cut',
  'Carat',
  'Color',
  'Natural Fancy Color',
  'Natural Fancy Color Intensity',
  'Natural Fancy Color Overtone',
  'Treated Color',
  'Clarity',
  'Cut Grade',
  'Grading Lab',
  'Certificate Number',
  'Certificate Path',
  'Image Path',
  'Online Report',
  'Video URL',
  '3DViewer URL',
  'Price Per Carat',
  'Total Price',
  '% Off IDEX List',
  // ... rest of headers
];

const LAB_GROWN_DIAMOND_HEADERS = [
  'Item ID',
  'Supplier Stock Ref',
  'Cut',
  'Carat',
  'Color',
  'Natural Fancy Color',
  'Natural Fancy Color Intensity',
  'Natural Fancy Color Overtone',
  'Treated Color',
  'Clarity',
  'Cut Grade',
  'Grading Lab',
  'Certificate Number',
  'Certificate URL',
  'Image URL',
  'Online Report URL',
  'Polish',
  'Symmetry',
  'Price Per Carat',
  'Total Price',
  // ... rest of headers
];

async function debugCSVImport() {
  console.log('=== DEBUGGING CSV IMPORT FROM IDEX ===\n');
  
  const IDEX_API_KEY = process.env.IDEX_API_KEY;
  const IDEX_API_SECRET = process.env.IDEX_API_SECRET;
  
  if (!IDEX_API_KEY || !IDEX_API_SECRET) {
    console.log('❌ Missing IDEX API credentials');
    return;
  }
  
  console.log('IDEX API Key:', IDEX_API_KEY.substring(0, 8) + '...');
  console.log('IDEX API Secret:', IDEX_API_SECRET.substring(0, 8) + '...\n');
  
  try {
    // Test both natural and lab diamond endpoints with correct URLs and formats
    const tests = [
      { 
        type: 'natural', 
        url: 'https://api.idexonline.com/onsite/api/fullfeed',
        format: 'format_20230628_extended'
      },
      { 
        type: 'lab', 
        url: 'https://api.idexonline.com/onsite/api/labgrownfullfile',
        format: 'format_lg_20221130'
      }
    ];
    
    for (const test of tests) {
      console.log(`=== Testing ${test.type.toUpperCase()} diamond data ===`);
      
      try {
        console.log(`Fetching from: ${test.url}`);
        
        const response = await fetch(test.url, {
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
              data_format: test.format,
              create_zip_file: true,
            },
          }),
        });
        
        if (!response.ok) {
          console.log(`❌ API request failed: ${response.status} ${response.statusText}`);
          const text = await response.text();
          console.log(`Response: ${text.substring(0, 500)}...\n`);
          continue;
        }
        
        console.log('✅ API request successful');
        
        // Get the response content
        const buffer = await response.buffer();
        console.log(`Downloaded ${buffer.length} bytes`);
        
        // Check if it's actually a ZIP or an error message
        const responseText = buffer.toString();
        console.log(`Response content: ${responseText}`);
        
        if (buffer.length < 1000) {
          console.log('❌ Response too small to be a ZIP file - likely an error message');
          continue;
        }
        
        // Extract ZIP
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(buffer);
        
        const csvFileName = Object.keys(zipContent.files)[0];
        console.log(`Found CSV file: ${csvFileName}`);
        
        const csvContent = await zipContent.files[csvFileName].async('text');
        console.log(`CSV content length: ${csvContent.length} characters`);
        
        // Parse first few lines
        const lines = csvContent.split('\n').slice(0, 5); // Header + 4 data rows
        console.log(`\nFirst ${lines.length} lines of CSV:`);
        
        lines.forEach((line, i) => {
          if (i === 0) {
            console.log(`HEADER: ${line}`);
            
            // Check if expected price columns exist
            const expectedHeaders = test.type === 'natural' ? NATURAL_DIAMOND_HEADERS : LAB_GROWN_DIAMOND_HEADERS;
            const hasPricePerCarat = line.includes('Price Per Carat');
            const hasTotalPrice = line.includes('Total Price');
            
            console.log(`   Expected "Price Per Carat": ${hasPricePerCarat ? '✅' : '❌'}`);
            console.log(`   Expected "Total Price": ${hasTotalPrice ? '✅' : '❌'}`);
            
            // Show actual price-related columns
            const columns = line.split(',').map(col => col.trim().replace(/"/g, ''));
            const priceColumns = columns.filter(col => 
              col.toLowerCase().includes('price') || 
              col.toLowerCase().includes('carat')
            );
            console.log(`   Price-related columns found: [${priceColumns.join(', ')}]`);
            
          } else {
            const values = line.split(',');
            
            // Find price column indices
            const headerLine = lines[0];
            const headers = headerLine.split(',').map(h => h.trim().replace(/"/g, ''));
            const pricePerCaratIndex = headers.findIndex(h => h === 'Price Per Carat');
            const totalPriceIndex = headers.findIndex(h => h === 'Total Price');
            
            let pricePerCaratValue = 'N/A';
            let totalPriceValue = 'N/A';
            
            if (pricePerCaratIndex >= 0 && pricePerCaratIndex < values.length) {
              pricePerCaratValue = values[pricePerCaratIndex].trim().replace(/"/g, '');
            }
            
            if (totalPriceIndex >= 0 && totalPriceIndex < values.length) {
              totalPriceValue = values[totalPriceIndex].trim().replace(/"/g, '');
            }
            
            console.log(`ROW ${i}: Price/Carat="${pricePerCaratValue}", Total="${totalPriceValue}"`);
          }
        });
        
        console.log('\n');
        
      } catch (error) {
        console.log(`❌ Error testing ${test.type}: ${error.message}\n`);
      }
    }
    
  } catch (error) {
    console.error('Error in debug:', error);
  }
}

debugCSVImport();