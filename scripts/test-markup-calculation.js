// Copy functions directly to avoid import issues
function getMarkupMultiplier(carat, type, markupRanges) {
  if (!carat || carat <= 0) {
    return 0;
  }

  // Find the appropriate range (exclusive upper bound except for the last range)
  const range = markupRanges.find((range, index) => {
    if (index === markupRanges.length - 1) {
      // Last range includes the upper bound
      return carat >= range.min && carat <= range.max;
    } else {
      // Other ranges exclude the upper bound
      return carat >= range.min && carat < range.max;
    }
  });

  if (!range) {
    return 0;
  }

  return range.multiplier;
}

function calculateFinalPriceSek(basePriceSek, carat, type, markupRanges) {
  if (!basePriceSek || basePriceSek <= 0) {
    return 0;
  }

  const multiplier = getMarkupMultiplier(carat, type, markupRanges);
  const priceWithMarkup = basePriceSek * multiplier;

  // Round to nearest 100 SEK
  const finalPrice = Math.round(priceWithMarkup / 100) * 100;

  return finalPrice;
}

// Test markup calculation with sample data
function testMarkupCalculation() {
  console.log('=== TESTING MARKUP CALCULATION ===\n');

  // Sample markup intervals (simulating database data)
  const sampleMarkupRanges = [
    { min: 0.0, max: 0.09, multiplier: 1.5 },     // 50% markup for 0-0.09 carat
    { min: 0.1, max: 0.19, multiplier: 1.6 },     // 60% markup for 0.1-0.19 carat
    { min: 0.2, max: 0.49, multiplier: 1.7 },     // 70% markup for 0.2-0.49 carat
    { min: 0.5, max: 0.99, multiplier: 1.8 },     // 80% markup for 0.5-0.99 carat
    { min: 1.0, max: 1.99, multiplier: 1.9 },     // 90% markup for 1.0-1.99 carat
    { min: 2.0, max: 5.0, multiplier: 2.0 }       // 100% markup for 2.0-5.0 carat
  ];

  // Test cases
  const testCases = [
    { carat: 0.05, basePriceSek: 10000, expectedMultiplier: 1.5 },
    { carat: 0.15, basePriceSek: 15000, expectedMultiplier: 1.6 },
    { carat: 0.25, basePriceSek: 20000, expectedMultiplier: 1.7 },
    { carat: 0.75, basePriceSek: 50000, expectedMultiplier: 1.8 },
    { carat: 1.5, basePriceSek: 100000, expectedMultiplier: 1.9 },
    { carat: 2.5, basePriceSek: 200000, expectedMultiplier: 2.0 },
  ];

  console.log('Testing with sample markup ranges:');
  sampleMarkupRanges.forEach((range, i) => {
    const markup = Math.round((range.multiplier - 1) * 100);
    console.log(`  ${i + 1}. ${range.min}-${range.max} carat: ${markup}% markup (${range.multiplier}x)`);
  });
  console.log();

  testCases.forEach((test, i) => {
    console.log(`Test ${i + 1}: ${test.carat} carat diamond`);
    console.log(`  Base price: ${test.basePriceSek.toLocaleString()} SEK`);
    
    const multiplier = getMarkupMultiplier(test.carat, 'natural', sampleMarkupRanges);
    const finalPrice = calculateFinalPriceSek(test.basePriceSek, test.carat, 'natural', sampleMarkupRanges);
    
    const expectedMarkupPrice = test.basePriceSek * test.expectedMultiplier;
    const expectedFinalPrice = Math.round(expectedMarkupPrice / 100) * 100;
    
    console.log(`  Multiplier found: ${multiplier} (expected: ${test.expectedMultiplier})`);
    console.log(`  Price with markup: ${(test.basePriceSek * multiplier).toLocaleString()} SEK`);
    console.log(`  Final price (rounded): ${finalPrice.toLocaleString()} SEK`);
    console.log(`  Expected final price: ${expectedFinalPrice.toLocaleString()} SEK`);
    console.log(`  ✅ Test ${multiplier === test.expectedMultiplier && finalPrice === expectedFinalPrice ? 'PASSED' : 'FAILED'}`);
    console.log();
  });

  // Test fallback scenario (no markup ranges)
  console.log('=== TESTING FALLBACK (NO MARKUP RANGES) ===');
  const noMarkupTest = {
    carat: 1.0,
    basePriceSek: 50000,
  };
  
  const fallbackMultiplier = getMarkupMultiplier(noMarkupTest.carat, 'natural', []);
  const fallbackFinalPrice = calculateFinalPriceSek(noMarkupTest.basePriceSek, noMarkupTest.carat, 'natural', []);
  
  console.log(`Carat: ${noMarkupTest.carat}`);
  console.log(`Base price: ${noMarkupTest.basePriceSek.toLocaleString()} SEK`);
  console.log(`Multiplier (no ranges): ${fallbackMultiplier}`);
  console.log(`Final price: ${fallbackFinalPrice.toLocaleString()} SEK`);
  console.log(`Expected: ${Math.round(noMarkupTest.basePriceSek / 100) * 100} SEK (rounded base price)`);
  console.log(`✅ Fallback test ${fallbackFinalPrice === Math.round(noMarkupTest.basePriceSek / 100) * 100 ? 'PASSED' : 'FAILED'}`);
}

testMarkupCalculation();