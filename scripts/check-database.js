import { PrismaClient } from '@prisma/client';

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== CHECKING MARKUP INTERVALS ===');
    const markupIntervals = await prisma.markupInterval.findMany();
    console.log('Markup Intervals:', markupIntervals);
    
    console.log('\n=== CHECKING DIAMONDS (first 3) ===');
    const diamonds = await prisma.diamond.findMany({
      take: 3,
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true,
        type: true
      }
    });
    
    diamonds.forEach(diamond => {
      console.log(`Diamond ${diamond.itemId}:`);
      console.log(`  Type: ${diamond.type}`);
      console.log(`  Carat: ${diamond.carat}`);
      console.log(`  USD Price: $${diamond.totalPrice}`);
      console.log(`  SEK Price (base): ${diamond.totalPriceSek} SEK`);
      console.log(`  SEK Price (with markup): ${diamond.priceWithMarkupSek} SEK`);
      console.log(`  Final SEK Price: ${diamond.finalPriceSek} SEK`);
      console.log('  ---');
    });
    
    console.log('\n=== CHECKING EXCHANGE RATES ===');
    const exchangeRates = await prisma.exchangeRate.findMany({
      orderBy: { createdAt: 'desc' },
      take: 3
    });
    console.log('Recent Exchange Rates:', exchangeRates);
    
    console.log('\n=== TOTAL COUNTS ===');
    const diamondCount = await prisma.diamond.count();
    const markupCount = await prisma.markupInterval.count();
    const rateCount = await prisma.exchangeRate.count();
    
    console.log(`Total diamonds: ${diamondCount}`);
    console.log(`Total markup intervals: ${markupCount}`);
    console.log(`Total exchange rates: ${rateCount}`);
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase();