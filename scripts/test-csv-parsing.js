import fs from 'fs';

// Test CSV parsing with actual sample data
function testCSVParsing() {
  console.log('=== TESTING CSV PARSING WITH SAMPLE DATA ===\n');
  
  // Read the sample files
  const naturalCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/natural-large-sample.csv', 'utf8');
  const labCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/lab-large-sample.csv', 'utf8');
  
  console.log('1. Analyzing natural diamond CSV...');
  const naturalLines = naturalCSV.split('\n');
  const naturalHeaders = naturalLines[0].split(',').map(h => h.trim());
  
  console.log(`   Total lines: ${naturalLines.length}`);
  console.log(`   Headers count: ${naturalHeaders.length}`);
  console.log(`   Headers: [${naturalHeaders.join(', ')}]`);
  
  // Find price column indices
  const naturalPricePerCaratIndex = naturalHeaders.findIndex(h => h === 'Price Per Carat');
  const naturalTotalPriceIndex = naturalHeaders.findIndex(h => h === 'Total Price');
  
  console.log(`   "Price Per Carat" at index: ${naturalPricePerCaratIndex}`);
  console.log(`   "Total Price" at index: ${naturalTotalPriceIndex}`);
  
  // Test first few data rows
  console.log('\n   First 3 data rows:');
  for (let i = 1; i <= Math.min(3, naturalLines.length - 1); i++) {
    const values = naturalLines[i].split(',');
    const itemId = values[0];
    const pricePerCarat = naturalPricePerCaratIndex >= 0 ? values[naturalPricePerCaratIndex] : 'N/A';
    const totalPrice = naturalTotalPriceIndex >= 0 ? values[naturalTotalPriceIndex] : 'N/A';
    
    console.log(`     Row ${i}: ItemID="${itemId}", PricePerCarat="${pricePerCarat}", TotalPrice="${totalPrice}"`);
  }
  
  console.log('\n2. Analyzing lab diamond CSV...');
  const labLines = labCSV.split('\n');
  const labHeaders = labLines[0].split(',').map(h => h.trim());
  
  console.log(`   Total lines: ${labLines.length}`);
  console.log(`   Headers count: ${labHeaders.length}`);
  console.log(`   Headers: [${labHeaders.join(', ')}]`);
  
  // Find price column indices  
  const labPricePerCaratIndex = labHeaders.findIndex(h => h === 'Price Per Carat');
  const labTotalPriceIndex = labHeaders.findIndex(h => h === 'Total Price');
  
  console.log(`   "Price Per Carat" at index: ${labPricePerCaratIndex}`);
  console.log(`   "Total Price" at index: ${labTotalPriceIndex}`);
  
  // Test first few data rows
  console.log('\n   First 3 data rows:');
  for (let i = 1; i <= Math.min(3, labLines.length - 1); i++) {
    const values = labLines[i].split(',');
    const itemId = values[0];
    const pricePerCarat = labPricePerCaratIndex >= 0 ? values[labPricePerCaratIndex] : 'N/A';
    const totalPrice = labTotalPriceIndex >= 0 ? values[labTotalPriceIndex] : 'N/A';
    
    console.log(`     Row ${i}: ItemID="${itemId}", PricePerCarat="${pricePerCarat}", TotalPrice="${totalPrice}"`);
  }
  
  // 3. Compare header structures
  console.log('\n3. Header comparison:');
  console.log(`   Natural headers count: ${naturalHeaders.length}`);
  console.log(`   Lab headers count: ${labHeaders.length}`);
  
  // Find key differences
  console.log('\n   Key differences:');
  console.log(`   Natural "Item ID #" vs Lab "Item ID": Different!`);
  
  // Check what the current IDEX service expects
  console.log('\n4. Expected vs Actual headers:');
  
  // Natural diamond expected headers from IDEX service
  const expectedNaturalHeaders = [
    'Item ID #', 'Supplier Stock Ref.', 'Cut', 'Carat', 'Color',
    'Natural Fancy Color', 'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone',
    'Treated Color', 'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number',
    'Certificate Path', 'Image Path', 'Online Report', 'Video URL', '3DViewer URL',
    'Price Per Carat', 'Total Price'
  ];
  
  // Lab diamond expected headers from IDEX service  
  const expectedLabHeaders = [
    'Item ID', 'Supplier Stock Ref', 'Cut', 'Carat', 'Color',
    'Natural Fancy Color', 'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone',
    'Treated Color', 'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number',
    'Certificate URL', 'Image URL', 'Online Report URL', 'Polish', 'Symmetry',
    'Price Per Carat', 'Total Price'
  ];
  
  console.log('\n   Natural Headers Match Check:');
  expectedNaturalHeaders.slice(0, 20).forEach((expected, i) => {
    const actual = naturalHeaders[i];
    const match = expected === actual;
    console.log(`     ${i}: "${expected}" vs "${actual}" ${match ? '✅' : '❌'}`);
  });
  
  console.log('\n   Lab Headers Match Check:');
  expectedLabHeaders.slice(0, 20).forEach((expected, i) => {
    const actual = labHeaders[i];
    const match = expected === actual;
    console.log(`     ${i}: "${expected}" vs "${actual}" ${match ? '✅' : '❌'}`);
  });
  
  // 5. Test the actual parsing logic that would be used
  console.log('\n5. Testing parsing logic simulation:');
  
  function testParseDiamondRow(headers, values, diamondType) {
    const headerMapping = {
      'Item ID #': 'itemId',
      'Item ID': 'itemId', 
      'Price Per Carat': 'pricePerCarat',
      'Total Price': 'totalPrice',
      'Carat': 'carat'
    };
    
    const diamond = {};
    
    headers.forEach((header, index) => {
      const fieldName = headerMapping[header];
      if (fieldName && values[index]) {
        let value = values[index].trim();
        
        // Convert numeric fields
        if (fieldName === 'pricePerCarat' || fieldName === 'totalPrice' || fieldName === 'carat') {
          value = parseFloat(value) || null;
        }
        
        diamond[fieldName] = value;
      }
    });
    
    diamond.type = diamondType;
    return diamond;
  }
  
  // Test natural diamond parsing
  const naturalTestValues = naturalLines[1].split(',');
  const parsedNatural = testParseDiamondRow(naturalHeaders, naturalTestValues, 'natural');
  console.log('\n   Parsed Natural Diamond:');
  console.log(`     ItemId: ${parsedNatural.itemId}`);
  console.log(`     Carat: ${parsedNatural.carat}`);
  console.log(`     Price Per Carat: ${parsedNatural.pricePerCarat}`);
  console.log(`     Total Price: ${parsedNatural.totalPrice}`);
  
  // Test lab diamond parsing
  const labTestValues = labLines[1].split(',');
  const parsedLab = testParseDiamondRow(labHeaders, labTestValues, 'lab');
  console.log('\n   Parsed Lab Diamond:');
  console.log(`     ItemId: ${parsedLab.itemId}`);
  console.log(`     Carat: ${parsedLab.carat}`);
  console.log(`     Price Per Carat: ${parsedLab.pricePerCarat}`);
  console.log(`     Total Price: ${parsedLab.totalPrice}`);
  
  if (parsedNatural.totalPrice && parsedLab.totalPrice) {
    console.log('\n✅ BOTH NATURAL AND LAB DIAMONDS HAVE PRICE DATA IN SAMPLES');
    console.log('   This means the import issue is likely:');
    console.log('   1. Different data was imported than these samples');
    console.log('   2. CSV parsing logic has a bug with production data'); 
    console.log('   3. Price data is empty/null in the actual production CSV');
  }
}

testCSVParsing();