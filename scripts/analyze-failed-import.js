import { PrismaClient } from '@prisma/client';

async function analyzeFailedImport() {
  console.log('=== ANALYZING FAILED NATURAL DIAMOND IMPORT ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check raw data patterns from the failed import
    console.log('1. Analyzing raw natural diamond data...');
    
    const naturalDiamonds = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 20,
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        pricePerCarat: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true,
        cut: true,
        color: true,
        clarity: true
      }
    });
    
    console.log(`Found ${naturalDiamonds.length} natural diamonds to analyze:\n`);
    
    let nullCaratCount = 0;
    let nullPriceCount = 0;
    let zeroPriceCount = 0;
    let zeroCaratCount = 0;
    let validDataCount = 0;
    let caratTooHighCount = 0;
    
    naturalDiamonds.forEach((diamond, i) => {
      console.log(`${i + 1}. Diamond ${diamond.itemId}:`);
      console.log(`   Carat: ${diamond.carat}`);
      console.log(`   USD Total: ${diamond.totalPrice}`);
      console.log(`   USD Per Carat: ${diamond.pricePerCarat}`);
      console.log(`   SEK Total: ${diamond.totalPriceSek}`);
      console.log(`   SEK Markup: ${diamond.priceWithMarkupSek}`);
      console.log(`   SEK Final: ${diamond.finalPriceSek}`);
      
      // Categorize the issue
      if (diamond.carat === null || diamond.carat === undefined) {
        nullCaratCount++;
        console.log('   ❌ ISSUE: NULL CARAT');
      } else if (diamond.carat <= 0) {
        zeroCaratCount++;
        console.log('   ❌ ISSUE: ZERO/NEGATIVE CARAT');
      } else if (diamond.carat > 5.0) {
        caratTooHighCount++;
        console.log('   ❌ ISSUE: CARAT TOO HIGH (above markup range)');
      } else if (diamond.totalPrice === null || diamond.totalPrice === undefined) {
        nullPriceCount++;
        console.log('   ❌ ISSUE: NULL USD PRICE');
      } else if (diamond.totalPrice <= 0) {
        zeroPriceCount++;
        console.log('   ❌ ISSUE: ZERO/NEGATIVE USD PRICE');
      } else {
        validDataCount++;
        console.log('   ✅ Valid input data - pricing should have worked');
      }
      
      console.log('');
    });
    
    // 2. Summary of issues
    console.log('2. Issue summary:');
    console.log(`   Null carat: ${nullCaratCount}`);
    console.log(`   Zero/negative carat: ${zeroCaratCount}`);
    console.log(`   Carat too high (>5.0): ${caratTooHighCount}`);
    console.log(`   Null USD price: ${nullPriceCount}`);
    console.log(`   Zero/negative USD price: ${zeroPriceCount}`);
    console.log(`   Valid input data: ${validDataCount}`);
    
    // 3. Check markup intervals for edge cases
    console.log('\n3. Checking markup interval coverage...');
    
    // Get carat distribution
    const caratStats = await prisma.diamond.aggregate({
      where: { 
        type: 'natural',
        carat: { not: null }
      },
      _min: { carat: true },
      _max: { carat: true },
      _count: { carat: true }
    });
    
    console.log(`   Carat range: ${caratStats._min.carat} - ${caratStats._max.carat}`);
    console.log(`   Diamonds with carat data: ${caratStats._count.carat}`);
    
    // Check if any carats fall outside markup range
    const markupIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    const maxMarkupCarat = Math.max(...markupIntervals.map(i => i.maxCarat));
    console.log(`   Markup range covers: 0 - ${maxMarkupCarat} carat`);
    
    if (caratStats._max.carat > maxMarkupCarat) {
      console.log(`   ❌ PROBLEM: Some diamonds have carats above markup range!`);
      
      const outsideRange = await prisma.diamond.count({
        where: {
          type: 'natural',
          carat: { gt: maxMarkupCarat }
        }
      });
      
      console.log(`   Diamonds outside markup range: ${outsideRange}`);
    }
    
    // 4. Compare with successful lab diamonds
    console.log('\n4. Comparing with successful lab diamonds...');
    
    const labSample = await prisma.diamond.findMany({
      where: { type: 'lab' },
      take: 5,
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        totalPriceSek: true,
        finalPriceSek: true
      }
    });
    
    console.log('Sample lab diamonds (successful):');
    labSample.forEach((diamond, i) => {
      console.log(`   ${i + 1}. ${diamond.itemId}: ${diamond.carat} carat, $${diamond.totalPrice} → ${diamond.finalPriceSek} SEK`);
    });
    
  } catch (error) {
    console.error('Error analyzing failed import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

analyzeFailedImport();