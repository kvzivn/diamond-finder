import { PrismaClient } from '@prisma/client';

async function debugPricingCalculation() {
  console.log('=== DEBUGGING PRICING CALCULATION ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check a natural diamond without prices
    console.log('1. Checking natural diamonds without finalPriceSek...');
    const naturalWithoutPrice = await prisma.diamond.findFirst({
      where: { 
        type: 'natural',
        finalPriceSek: null
      },
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        pricePerCarat: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true
      }
    });
    
    if (naturalWithoutPrice) {
      console.log(`Diamond ${naturalWithoutPrice.itemId}:`);
      console.log(`  carat: ${naturalWithoutPrice.carat}`);
      console.log(`  totalPrice (USD): ${naturalWithoutPrice.totalPrice}`);
      console.log(`  pricePerCarat (USD): ${naturalWithoutPrice.pricePerCarat}`);
      console.log(`  totalPriceSek: ${naturalWithoutPrice.totalPriceSek}`);
      console.log(`  priceWithMarkupSek: ${naturalWithoutPrice.priceWithMarkupSek}`);
      console.log(`  finalPriceSek: ${naturalWithoutPrice.finalPriceSek}`);
      
      if (!naturalWithoutPrice.totalPrice) {
        console.log('  ❌ ROOT CAUSE: totalPrice is null - no USD price from IDEX!');
      } else {
        console.log('  🤔 Has USD price but no SEK price - pricing calculation issue');
      }
    }
    
    // 2. Check exchange rate
    console.log('\n2. Checking exchange rate...');
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'SEK',
        validUntil: null
      },
      orderBy: { validFrom: 'desc' }
    });
    
    if (exchangeRate) {
      console.log(`✅ Exchange rate: ${exchangeRate.rate} (${exchangeRate.validFrom})`);
    } else {
      console.log('❌ NO exchange rate found!');
    }
    
    // 3. Check markup intervals for natural diamonds
    console.log('\n3. Checking natural markup intervals...');
    const naturalIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log(`Found ${naturalIntervals.length} natural markup intervals:`);
    naturalIntervals.forEach(interval => {
      console.log(`  ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x`);
    });
    
    // 4. Manual pricing calculation test
    if (naturalWithoutPrice && naturalWithoutPrice.totalPrice && exchangeRate && naturalIntervals.length > 0) {
      console.log('\n4. Manual pricing calculation test...');
      
      const usdPrice = naturalWithoutPrice.totalPrice;
      const carat = naturalWithoutPrice.carat;
      const exchangeRateValue = exchangeRate.rate;
      
      console.log(`Testing diamond ${naturalWithoutPrice.itemId}:`);
      console.log(`  USD price: $${usdPrice}`);
      console.log(`  Carat: ${carat}`);
      console.log(`  Exchange rate: ${exchangeRateValue}`);
      
      // Convert to SEK
      const totalPriceSek = usdPrice * exchangeRateValue;
      console.log(`  Total SEK: ${totalPriceSek}`);
      
      // Find markup
      const range = naturalIntervals.find((range, index) => {
        if (index === naturalIntervals.length - 1) {
          return carat >= range.minCarat && carat <= range.maxCarat;
        } else {
          return carat >= range.minCarat && carat < range.maxCarat;
        }
      });
      
      if (range) {
        const multiplier = range.multiplier;
        const priceWithMarkup = totalPriceSek * multiplier;
        const finalPrice = Math.round(priceWithMarkup / 100) * 100;
        
        console.log(`  Markup range: ${range.minCarat}-${range.maxCarat} (${multiplier}x)`);
        console.log(`  Price with markup: ${priceWithMarkup}`);
        console.log(`  Final price (rounded): ${finalPrice} SEK`);
        console.log(`  ✅ Manual calculation works!`);
        
        // Update this diamond to test
        console.log(`\n5. Applying fix to diamond ${naturalWithoutPrice.itemId}...`);
        await prisma.diamond.update({
          where: { itemId: naturalWithoutPrice.itemId },
          data: {
            totalPriceSek: totalPriceSek,
            priceWithMarkupSek: priceWithMarkup,
            finalPriceSek: finalPrice
          }
        });
        console.log(`✅ Updated diamond ${naturalWithoutPrice.itemId} with calculated prices`);
        
      } else {
        console.log(`  ❌ No markup range found for ${carat} carat!`);
      }
    }
    
    // 5. Check if import process is missing pricing step
    console.log('\n6. Checking if import skipped pricing for natural diamonds...');
    
    const naturalStats = await prisma.diamond.aggregate({
      where: { type: 'natural' },
      _count: {
        _all: true,
        totalPrice: true,
        totalPriceSek: true,
        finalPriceSek: true
      }
    });
    
    console.log(`Natural diamond stats:`);
    console.log(`  Total: ${naturalStats._count._all}`);
    console.log(`  With USD totalPrice: ${naturalStats._count.totalPrice}`);
    console.log(`  With SEK totalPriceSek: ${naturalStats._count.totalPriceSek}`);
    console.log(`  With finalPriceSek: ${naturalStats._count.finalPriceSek}`);
    
    if (naturalStats._count.totalPrice === 0) {
      console.log('\n❌ CRITICAL: ALL natural diamonds missing USD prices!');
      console.log('This means the IDEX import for natural diamonds returned empty price fields.');
      console.log('Need to re-run natural diamond import when IDEX has price data.');
    } else if (naturalStats._count.totalPriceSek === 0) {
      console.log('\n❌ PRICING BUG: Natural diamonds have USD prices but no SEK pricing calculated!');
      console.log('The import process failed to run pricing calculations.');
    }
    
  } catch (error) {
    console.error('Error debugging pricing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugPricingCalculation();