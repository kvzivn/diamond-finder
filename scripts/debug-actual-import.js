import fetch from 'node-fetch';
import JSZip from 'jszip';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function debugActualImport() {
  console.log('=== DEBUGGING ACTUAL IMPORT DATA ===\n');
  
  const IDEX_API_KEY = process.env.IDEX_API_KEY;
  const IDEX_API_SECRET = process.env.IDEX_API_SECRET;
  
  try {
    console.log('1. Fetching FRESH data from IDEX natural diamond API...');
    
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
    });
    
    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status}`);
      return;
    }
    
    console.log(`✅ API response received: ${(await response.clone().buffer()).length} bytes`);
    
    // Extract ZIP and analyze CSV
    const zipBuffer = await response.buffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    const csvFileName = Object.keys(zipContent.files)[0];
    console.log(`CSV file: ${csvFileName}`);
    
    const csvContent = await zipContent.files[csvFileName].async('text');
    console.log(`CSV content length: ${csvContent.length} characters`);
    
    // Save first 1000 lines for analysis
    const lines = csvContent.split('\\n');
    const sample = lines.slice(0, 1000).join('\\n');
    
    fs.writeFileSync('/Users/bae/dev/diamond-finder/debug-fresh-natural.csv', sample);
    console.log('✅ Saved first 1000 lines to debug-fresh-natural.csv');
    
    // Analyze headers and first few rows
    const headers = lines[0].split(',').map(h => h.trim());
    console.log(`\\nHeaders (${headers.length} total):`);
    console.log(headers.join(', '));
    
    // Find price column indices
    const pricePerCaratIndex = headers.findIndex(h => h === 'Price Per Carat');
    const totalPriceIndex = headers.findIndex(h => h === 'Total Price');
    
    console.log(`\\n"Price Per Carat" column index: ${pricePerCaratIndex}`);
    console.log(`"Total Price" column index: ${totalPriceIndex}`);
    
    if (pricePerCaratIndex === -1 || totalPriceIndex === -1) {
      console.log('❌ CRITICAL: Price columns not found!');
      console.log('Expected headers: "Price Per Carat", "Total Price"');
      
      // Show headers that contain "price"
      const priceHeaders = headers.filter(h => h.toLowerCase().includes('price'));
      console.log(`Price-related headers found: [${priceHeaders.join(', ')}]`);
      return;
    }
    
    // Analyze first 10 data rows for price data
    console.log('\\nFirst 10 data rows price analysis:');
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
      const values = lines[i].split(',');
      const itemId = values[0] || 'N/A';
      const carat = values[3] || 'N/A'; // Assuming carat is column 3
      const pricePerCarat = values[pricePerCaratIndex] || '';
      const totalPrice = values[totalPriceIndex] || '';
      
      console.log(`  Row ${i}: ID=${itemId}, Carat=${carat}, PricePerCarat="${pricePerCarat}", TotalPrice="${totalPrice}"`);
      
      if (pricePerCarat === '' && totalPrice === '') {
        console.log(`    ❌ Row ${i}: Both price fields are EMPTY`);
      } else if (pricePerCarat === '' || totalPrice === '') {
        console.log(`    ⚠️ Row ${i}: One price field is empty`);
      } else {
        console.log(`    ✅ Row ${i}: Has price data`);
      }
    }
    
    // Count how many rows have price data
    let rowsWithPrices = 0;
    let rowsWithoutPrices = 0;
    let totalDataRows = 0;
    
    for (let i = 1; i < Math.min(100, lines.length); i++) { // Check first 100 rows
      const values = lines[i].split(',');
      if (values.length > Math.max(pricePerCaratIndex, totalPriceIndex)) {
        totalDataRows++;
        const pricePerCarat = values[pricePerCaratIndex]?.trim() || '';
        const totalPrice = values[totalPriceIndex]?.trim() || '';
        
        if (pricePerCarat !== '' && totalPrice !== '') {
          rowsWithPrices++;
        } else {
          rowsWithoutPrices++;
        }
      }
    }
    
    console.log(`\\n=== PRICE DATA ANALYSIS (first 100 rows) ===`);
    console.log(`Total data rows: ${totalDataRows}`);
    console.log(`Rows with prices: ${rowsWithPrices}`);
    console.log(`Rows without prices: ${rowsWithoutPrices}`);
    console.log(`Percentage with prices: ${((rowsWithPrices / totalDataRows) * 100).toFixed(1)}%`);
    
    if (rowsWithoutPrices > rowsWithPrices) {
      console.log('❌ CRITICAL: Majority of rows have NO price data!');
      console.log('This explains why natural diamonds have null prices.');
      console.log('\\nPossible causes:');
      console.log('1. IDEX changed their data format');
      console.log('2. Price data is in different columns');
      console.log('3. Data access issue with the API key');
      console.log('4. Different data format than the sample files');
    } else {
      console.log('✅ Majority of rows have price data - parsing issue likely');
    }
    
  } catch (error) {
    console.error('Error debugging actual import:', error);
  }
}

debugActualImport();