import fetch from 'node-fetch';
import JSZip from 'jszip';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

async function analyzeFreshData() {
  console.log('=== ANALYZING FRESH IDEX DATA ===\n');
  
  const IDEX_API_KEY = process.env.IDEX_API_KEY;
  const IDEX_API_SECRET = process.env.IDEX_API_SECRET;
  
  try {
    console.log('1. Fetching fresh data from IDEX...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
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
    
    if (!response.ok) {
      console.log(`❌ API request failed: ${response.status}`);
      return;
    }
    
    console.log('2. Extracting ZIP and analyzing CSV...');
    
    // Extract ZIP
    const zipBuffer = await response.buffer();
    const zip = new JSZip();
    const zipContent = await zip.loadAsync(zipBuffer);
    
    const csvFileName = Object.keys(zipContent.files)[0];
    console.log(`CSV file: ${csvFileName}`);
    
    const csvContent = await zipContent.files[csvFileName].async('text');
    const lines = csvContent.split('\n');
    
    console.log(`Total lines in CSV: ${lines.length}`);
    
    // Analyze headers
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    console.log(`\nHeaders (${headers.length} total):`);
    
    // Find price-related headers
    const priceHeaders = [];
    headers.forEach((header, index) => {
      if (header.toLowerCase().includes('price')) {
        priceHeaders.push({ header, index });
        console.log(`  ${index}: "${header}" (PRICE COLUMN)`);
      } else if (index < 20) {
        console.log(`  ${index}: "${header}"`);
      }
    });
    
    console.log(`\nFound ${priceHeaders.length} price-related columns:`);
    priceHeaders.forEach(p => console.log(`  Column ${p.index}: "${p.header}"`));
    
    // Find the exact price column indices we expect
    const pricePerCaratIndex = headers.findIndex(h => h === 'Price Per Carat');
    const totalPriceIndex = headers.findIndex(h => h === 'Total Price');
    
    console.log(`\n"Price Per Carat" column: ${pricePerCaratIndex}`);
    console.log(`"Total Price" column: ${totalPriceIndex}`);
    
    // Analyze first 20 data rows
    console.log(`\n3. Analyzing first 20 data rows for price data:`);
    
    let rowsWithPrices = 0;
    let rowsWithoutPrices = 0;
    
    for (let i = 1; i <= Math.min(20, lines.length - 1); i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
      
      if (values.length < Math.max(pricePerCaratIndex, totalPriceIndex)) {
        console.log(`Row ${i}: Insufficient columns (${values.length})`);
        continue;
      }
      
      const itemId = values[0] || 'N/A';
      const carat = values[3] || 'N/A';
      const pricePerCarat = pricePerCaratIndex >= 0 ? (values[pricePerCaratIndex] || '') : 'N/A';
      const totalPrice = totalPriceIndex >= 0 ? (values[totalPriceIndex] || '') : 'N/A';
      
      console.log(`Row ${i}: ID=${itemId}, Carat=${carat}, PPC="${pricePerCarat}", Total="${totalPrice}"`);
      
      if (pricePerCarat && pricePerCarat !== '' && totalPrice && totalPrice !== '') {
        rowsWithPrices++;
        console.log(`  ✅ HAS PRICES`);
      } else {
        rowsWithoutPrices++;
        console.log(`  ❌ MISSING PRICES (PPC="${pricePerCarat}", Total="${totalPrice}")`);
      }
    }
    
    console.log(`\n=== PRICE DATA SUMMARY ===`);
    console.log(`Rows with prices: ${rowsWithPrices}`);
    console.log(`Rows without prices: ${rowsWithoutPrices}`);
    
    if (rowsWithPrices > 0) {
      console.log(`✅ FRESH DATA HAS PRICES! Our import system has a bug.`);
    } else {
      console.log(`❌ Fresh data also missing prices - IDEX API issue`);
    }
    
    // Save sample for further analysis
    const sampleLines = lines.slice(0, 100);
    fs.writeFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', sampleLines.join('\n'));
    console.log(`\n✅ Saved first 100 lines to debug-fresh-sample.csv`);
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Request timed out');
    } else {
      console.error('❌ Error analyzing fresh data:', error);
    }
  }
}

analyzeFreshData();