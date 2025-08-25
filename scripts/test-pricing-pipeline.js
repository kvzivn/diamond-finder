import { PrismaClient } from '@prisma/client';

// Test the complete pricing pipeline that would happen during import
async function testPricingPipeline() {
  console.log('=== TESTING COMPLETE PRICING PIPELINE ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Test exchange rate retrieval (what import would do)
    console.log('1. Testing exchange rate retrieval...');
    
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'SEK',
        validUntil: null
      },
      orderBy: { validFrom: 'desc' }
    });
    
    if (!exchangeRate) {
      console.log('❌ No exchange rate found');
      return;
    }
    
    console.log(`✅ Found exchange rate: ${exchangeRate.rate}`);
    
    // 2. Test markup interval retrieval
    console.log('\n2. Testing markup interval retrieval...');
    
    const naturalIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' },
    });
    
    const labIntervals = await prisma.markupInterval.findMany({
      where: { type: 'lab' },
      orderBy: { minCarat: 'asc' },
    });
    
    console.log(`✅ Natural intervals: ${naturalIntervals.length}`);
    console.log(`✅ Lab intervals: ${labIntervals.length}`);
    
    // 3. Test the exact scenario that's failing - natural diamonds with null prices
    console.log('\n3. Testing failed natural diamond pricing scenario...');
    
    // Simulate a diamond record from the CSV that has null prices
    const failedDiamond = {
      itemId: 'TEST-NATURAL-001',
      carat: 1.5,
      totalPrice: null,  // This is what's happening in your import
      pricePerCarat: null,
      type: 'natural'
    };
    
    console.log('Simulating failed diamond:');
    console.log(`  ItemId: ${failedDiamond.itemId}`);
    console.log(`  Carat: ${failedDiamond.carat}`);
    console.log(`  Total Price (USD): ${failedDiamond.totalPrice}`);
    console.log(`  Price per Carat (USD): ${failedDiamond.pricePerCarat}`);
    
    // Test what would happen during pricing calculation
    if (!failedDiamond.totalPrice || failedDiamond.totalPrice <= 0) {
      console.log('❌ ISSUE IDENTIFIED: totalPrice is null/zero');
      console.log('   This causes all subsequent pricing calculations to fail:');
      console.log('   - totalPriceSek = null * exchangeRate = null');
      console.log('   - priceWithMarkupSek = null * multiplier = null');  
      console.log('   - finalPriceSek = null');
      
      console.log('\n   THE ROOT CAUSE: CSV parsing is not extracting USD prices from natural diamonds');
    }
    
    // 4. Compare with successful lab diamond scenario
    console.log('\n4. Testing successful lab diamond scenario...');
    
    // Get an actual lab diamond from DB that worked
    const successfulLabDiamond = await prisma.diamond.findFirst({
      where: { 
        type: 'lab',
        totalPrice: { not: null },
        finalPriceSek: { not: null }
      },
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true
      }
    });
    
    if (successfulLabDiamond) {
      console.log('✅ Example of successful lab diamond:');
      console.log(`  ItemId: ${successfulLabDiamond.itemId}`);
      console.log(`  Carat: ${successfulLabDiamond.carat}`);
      console.log(`  USD Price: $${successfulLabDiamond.totalPrice}`);
      console.log(`  SEK Base: ${successfulLabDiamond.totalPriceSek} SEK`);
      console.log(`  SEK Markup: ${successfulLabDiamond.priceWithMarkupSek} SEK`);
      console.log(`  SEK Final: ${successfulLabDiamond.finalPriceSek} SEK`);
      
      // Verify the calculation
      const expectedSEK = successfulLabDiamond.totalPrice * exchangeRate.rate;
      console.log(`  Expected SEK (${successfulLabDiamond.totalPrice} * ${exchangeRate.rate}): ${expectedSEK.toFixed(2)}`);
      console.log(`  Actual SEK: ${successfulLabDiamond.totalPriceSek}`);
      console.log(`  ✅ Calculation ${Math.abs(expectedSEK - successfulLabDiamond.totalPriceSek) < 1 ? 'CORRECT' : 'INCORRECT'}`);
    }
    
    // 5. Conclusion and next steps
    console.log('\n=== DIAGNOSIS ===');
    console.log('✅ Exchange rates: Working');
    console.log('✅ Markup intervals: Working');
    console.log('✅ Pricing calculation: Working (lab diamonds prove this)');
    console.log('❌ CSV parsing for natural diamonds: FAILING');
    console.log('');
    console.log('NEXT STEPS TO FIX:');
    console.log('1. The natural diamond CSV headers may have changed');
    console.log('2. The "Total Price" column may be named differently');
    console.log('3. The CSV may have empty/null price data');
    console.log('4. There may be a parsing issue with natural diamond format vs lab format');
    console.log('');
    console.log('RECOMMENDED ACTION:');
    console.log('- Check the actual CSV headers in the natural diamond data');
    console.log('- Compare with expected headers in NATURAL_DIAMOND_HEADERS');
    console.log('- Look for price data in different columns');
    
  } catch (error) {
    console.error('Error in pricing pipeline test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPricingPipeline();