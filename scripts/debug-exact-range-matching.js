import { PrismaClient } from '@prisma/client';

async function debugExactRangeMatching() {
  console.log('=== DEBUGGING EXACT RANGE MATCHING ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get intervals and transform them like the service does
    const intervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' },
    });

    const caratRanges = intervals.map((interval) => ({
      min: interval.minCarat,
      max: interval.maxCarat,
      multiplier: interval.multiplier,
    }));
    
    const testCarat = 0.89;
    console.log(`Testing carat: ${testCarat}`);
    console.log(`Total ranges: ${caratRanges.length}\n`);
    
    // Test each range manually
    console.log('Manual range checking:');
    caratRanges.forEach((range, index) => {
      const isLast = index === caratRanges.length - 1;
      
      // Apply the exact logic from diamond-pricing.server.ts
      let matches;
      if (isLast) {
        matches = testCarat >= range.min && testCarat <= range.max;
      } else {
        matches = testCarat >= range.min && testCarat < range.max;
      }
      
      if (range.min <= 0.9 && range.max >= 0.8) { // Show relevant ranges
        console.log(`  ${range.min}-${range.max}: ${range.multiplier}x [Last: ${isLast}] Match: ${matches ? '✅' : '❌'}`);
        
        if (range.min === 0.8) {
          console.log(`    Detailed check for 0.8-0.89 range:`);
          console.log(`    ${testCarat} >= ${range.min} = ${testCarat >= range.min}`);
          console.log(`    ${testCarat} < ${range.max} = ${testCarat < range.max}`);
          console.log(`    Combined (${testCarat >= range.min} && ${testCarat < range.max}) = ${testCarat >= range.min && testCarat < range.max}`);
        }
      }
    });
    
    // Use the exact find logic
    console.log('\nUsing find() logic:');
    const foundRange = caratRanges.find((range, index) => {
      if (index === caratRanges.length - 1) {
        return testCarat >= range.min && testCarat <= range.max;
      } else {
        return testCarat >= range.min && testCarat < range.max;
      }
    });
    
    if (foundRange) {
      console.log(`✅ FOUND: ${foundRange.min}-${foundRange.max} = ${foundRange.multiplier}x`);
    } else {
      console.log(`❌ NOT FOUND: No matching range for ${testCarat}`);
    }
    
    // Test the issue - maybe floating point precision
    console.log('\n=== TESTING FLOATING POINT PRECISION ===');
    const range08089 = caratRanges.find(r => r.min === 0.8 && r.max === 0.89);
    if (range08089) {
      console.log(`Found 0.8-0.89 range: ${range08089.min}-${range08089.max}`);
      console.log(`Type of min: ${typeof range08089.min}, value: ${range08089.min}`);
      console.log(`Type of max: ${typeof range08089.max}, value: ${range08089.max}`);
      
      console.log(`0.89 >= 0.8: ${0.89 >= range08089.min}`);
      console.log(`0.89 < 0.89: ${0.89 < range08089.max}`);
      console.log(`Result: ${0.89 >= range08089.min && 0.89 < range08089.max}`);
      
      // THE PROBLEM: 0.89 < 0.89 is FALSE!
      console.log('\n❌ ISSUE IDENTIFIED: 0.89 < 0.89 = false');
      console.log('   The range 0.8-0.89 excludes 0.89 because it uses < for upper bound');
      console.log('   But there\'s no range that includes 0.89!');
    }
    
    // Check what range should include 0.89
    const range09 = caratRanges.find(r => r.min === 0.9);
    if (range09) {
      console.log(`\n0.9 range: ${range09.min}-${range09.max}`);
      console.log(`0.89 >= 0.9: ${0.89 >= range09.min} (should be false)`);
    }
    
    console.log('\n=== ROOT CAUSE IDENTIFIED ===');
    console.log('The ranges have a boundary issue:');
    console.log('- 0.8-0.89 range excludes 0.89 (uses carat < max)');
    console.log('- 0.9-0.99 range excludes 0.89 (0.89 < 0.9)');
    console.log('- Result: 0.89 falls into no range!');
    console.log('\nThis is a design flaw in the range boundaries.');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugExactRangeMatching();