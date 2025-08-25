import fs from 'fs';

function debugLine9() {
  console.log('=== DEBUGGING LINE 9 SPECIFICALLY ===\n');
  
  const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const line9 = lines[8]; // 0-indexed (line 9 is index 8)
  
  console.log(`Line 9 raw content:`);
  console.log(line9);
  console.log('');
  
  console.log(`Line 9 contains YouTube URL: ${line9.includes('youtube.com')}`);
  console.log(`YouTube URL: ${line9.match(/https:\/\/[^,]*youtube\.com[^,]*/)?.[0] || 'Not found'}`);
  console.log('');
  
  const values = line9.split(',');
  console.log(`Headers: ${headers.length}`);
  console.log(`Values after split: ${values.length}`);
  console.log('');
  
  // Check if YouTube URL got split
  const videoUrlIndex = headers.indexOf('Video URL');
  console.log(`Video URL header index: ${videoUrlIndex}`);
  console.log(`Video URL value: "${values[videoUrlIndex] || 'MISSING'}"`);
  console.log('');
  
  const pricePerCaratIndex = headers.indexOf('Price Per Carat');
  const totalPriceIndex = headers.indexOf('Total Price');
  
  console.log(`Price Per Carat (index ${pricePerCaratIndex}): "${values[pricePerCaratIndex] || 'MISSING'}"`);
  console.log(`Total Price (index ${totalPriceIndex}): "${values[totalPriceIndex] || 'MISSING'}"`);
  console.log('');
  
  // Count expected vs actual commas
  const expectedCommas = headers.length - 1;
  const actualCommas = (line9.match(/,/g) || []).length;
  
  console.log(`Expected commas: ${expectedCommas}`);
  console.log(`Actual commas: ${actualCommas}`);
  console.log(`Difference: ${actualCommas - expectedCommas}`);
  
  if (actualCommas !== expectedCommas) {
    console.log('❌ COMMA MISMATCH - This line has CSV parsing issues!');
    
    // Show values around the price columns
    console.log('\nValues around price columns:');
    for (let i = pricePerCaratIndex - 2; i <= totalPriceIndex + 2; i++) {
      if (i >= 0 && i < values.length) {
        const marker = i === pricePerCaratIndex ? '← Price Per Carat' : 
                      i === totalPriceIndex ? '← Total Price' : '';
        console.log(`  [${i}]: "${values[i]}" ${marker}`);
      }
    }
  } else {
    console.log('✅ Comma count matches - CSV parsing should work');
  }
}

debugLine9();