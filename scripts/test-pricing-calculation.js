import { PrismaClient } from '@prisma/client';

// Copy pricing functions to avoid import issues
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

async function getMarkupIntervals(type, prisma) {
  const intervals = await prisma.markupInterval.findMany({
    where: { type },
    orderBy: { minCarat: 'asc' },
  });

  return intervals.map((interval) => ({
    min: interval.minCarat,
    max: interval.maxCarat,
    multiplier: interval.multiplier,
  }));
}

async function testPricingCalculation() {
  console.log('=== TESTING COMPLETE PRICING CALCULATION ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Get current exchange rate
    console.log('1. Getting current exchange rate...');
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
    
    console.log(`✅ Exchange rate: ${exchangeRate.rate} USD→SEK`);
    
    // 2. Get markup intervals for both types
    console.log('\n2. Getting markup intervals...');
    const naturalIntervals = await getMarkupIntervals('natural', prisma);
    const labIntervals = await getMarkupIntervals('lab', prisma);
    
    console.log(`✅ Natural intervals: ${naturalIntervals.length}`);
    console.log(`✅ Lab intervals: ${labIntervals.length}`);
    
    // 3. Test complete pricing flow with sample diamonds
    console.log('\n3. Testing complete pricing calculation...');
    
    const testDiamonds = [
      { type: 'natural', carat: 0.35, totalPrice: 500, itemId: 'TEST-N-001' },
      { type: 'natural', carat: 1.0, totalPrice: 2000, itemId: 'TEST-N-002' },
      { type: 'natural', carat: 2.5, totalPrice: 8000, itemId: 'TEST-N-003' },
      { type: 'lab', carat: 0.5, totalPrice: 300, itemId: 'TEST-L-001' },
      { type: 'lab', carat: 1.5, totalPrice: 1500, itemId: 'TEST-L-002' },
    ];
    
    testDiamonds.forEach((diamond, i) => {
      console.log(`\n   Test ${i + 1}: ${diamond.itemId} (${diamond.type})`);
      console.log(`     Input: ${diamond.carat} carat, $${diamond.totalPrice} USD`);
      
      // Step 1: USD to SEK conversion
      const totalPriceSek = diamond.totalPrice * exchangeRate.rate;
      console.log(`     USD→SEK: ${totalPriceSek.toFixed(2)} SEK`);
      
      // Step 2: Get markup multiplier
      const intervals = diamond.type === 'natural' ? naturalIntervals : labIntervals;
      const multiplier = getMarkupMultiplier(diamond.carat, diamond.type, intervals);
      console.log(`     Markup multiplier: ${multiplier}x`);
      
      if (multiplier === 0) {
        console.log(`     ❌ NO MULTIPLIER FOUND - this would cause null prices!`);
      } else {
        // Step 3: Apply markup
        const priceWithMarkupSek = totalPriceSek * multiplier;
        console.log(`     With markup: ${priceWithMarkupSek.toFixed(2)} SEK`);
        
        // Step 4: Round to nearest 100
        const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
        console.log(`     Final price: ${finalPriceSek} SEK`);
        
        const markupPercent = Math.round((multiplier - 1) * 100);
        console.log(`     Markup: ${markupPercent}%`);
      }
    });
    
    // 4. Test edge cases that might cause issues
    console.log('\n4. Testing edge cases...');
    
    const edgeCases = [
      { carat: null, price: 1000, description: 'null carat' },
      { carat: 0, price: 1000, description: 'zero carat' },
      { carat: -1, price: 1000, description: 'negative carat' },
      { carat: 1.0, price: null, description: 'null price' },
      { carat: 1.0, price: 0, description: 'zero price' },
      { carat: 6.0, price: 50000, description: 'carat above range' },
    ];
    
    edgeCases.forEach((testCase, i) => {
      console.log(`\n   Edge case ${i + 1}: ${testCase.description}`);
      console.log(`     Input: ${testCase.carat} carat, $${testCase.price} USD`);
      
      if (!testCase.price || testCase.price <= 0) {
        console.log(`     ❌ Would result in null/zero prices (invalid input)`);
      } else if (!testCase.carat || testCase.carat <= 0) {
        console.log(`     ❌ Would get 0x multiplier (invalid carat) → null prices`);
      } else {
        const multiplier = getMarkupMultiplier(testCase.carat, 'natural', naturalIntervals);
        if (multiplier === 0) {
          console.log(`     ❌ No multiplier found for ${testCase.carat} carat → null prices`);
        } else {
          const totalPriceSek = testCase.price * exchangeRate.rate;
          const finalPrice = Math.round((totalPriceSek * multiplier) / 100) * 100;
          console.log(`     ✅ Would calculate to ${finalPrice} SEK`);
        }
      }
    });
    
  } catch (error) {
    console.error('Error testing pricing calculation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPricingCalculation();