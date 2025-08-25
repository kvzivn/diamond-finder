import fs from 'fs';

function testCsvParsingBug() {
  console.log('=== TESTING CSV PARSING BUG ===\n');
  
  // Get the fresh sample data
  const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  console.log(`Headers found: ${headers.length}`);
  console.log(`"Price Per Carat" at index: ${headers.indexOf('Price Per Carat')}`);
  console.log(`"Total Price" at index: ${headers.indexOf('Total Price')}`);
  
  // Test line 2 (first data line)
  console.log('\n=== TESTING LINE 2 (Diamond 122870891) ===');
  const line2 = lines[1];
  console.log(`Raw line: ${line2}`);
  
  const values = line2.split(',');
  console.log(`Values found: ${values.length}`);
  console.log(`Expected headers: ${headers.length}`);
  
  if (values.length !== headers.length) {
    console.log(`❌ MISMATCH! Values: ${values.length}, Headers: ${headers.length}`);
  }
  
  const pricePerCaratIndex = headers.indexOf('Price Per Carat');
  const totalPriceIndex = headers.indexOf('Total Price');
  
  console.log(`\nPrice columns:`);
  console.log(`  Price Per Carat (${pricePerCaratIndex}): "${values[pricePerCaratIndex] || 'MISSING'}"`);
  console.log(`  Total Price (${totalPriceIndex}): "${values[totalPriceIndex] || 'MISSING'}"`);
  
  // Test line with video URL (line 9)
  console.log('\n=== TESTING LINE 9 (Has YouTube URL) ===');
  const line9 = lines[8]; // 0-indexed
  console.log(`Raw line: ${line9.substring(0, 200)}...`);
  
  const values9 = line9.split(',');
  console.log(`Values found: ${values9.length}`);
  console.log(`Price Per Carat (${pricePerCaratIndex}): "${values9[pricePerCaratIndex] || 'MISSING'}"`);
  console.log(`Total Price (${totalPriceIndex}): "${values9[totalPriceIndex] || 'MISSING'}"`);
  
  // Count commas in the line
  const commasInLine = (line9.match(/,/g) || []).length;
  console.log(`Commas in line: ${commasInLine}`);
  console.log(`Expected commas (headers - 1): ${headers.length - 1}`);
  
  if (commasInLine > headers.length - 1) {
    console.log(`❌ EXTRA COMMAS! This will cause split() to create too many values`);
  }
  
  console.log('\n=== SOLUTION ===');
  console.log('The CSV contains URLs and other values with commas inside them.');
  console.log('We need proper CSV parsing that handles quoted fields, not simple split(",")');
  console.log('This is why prices appear null - they\'re being read from wrong columns!');
}

testCsvParsingBug();