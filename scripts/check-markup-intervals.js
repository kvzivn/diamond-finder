import { PrismaClient } from '@prisma/client';

async function checkMarkupIntervals() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== CHECKING MARKUP INTERVALS ===\n');
    
    const intervals = await prisma.markupInterval.findMany({
      orderBy: [{ type: 'asc' }, { minCarat: 'asc' }]
    });
    
    if (intervals.length === 0) {
      console.log('❌ NO MARKUP INTERVALS FOUND IN DATABASE!');
      console.log('This explains why prices are null - the system needs markup intervals to calculate prices.');
      console.log('\nThe system falls back to default 1.0x multipliers, but if exchange rates are also missing, prices become null.');
    } else {
      console.log(`✅ Found ${intervals.length} markup intervals:`);
      
      const naturalIntervals = intervals.filter(i => i.type === 'natural');
      const labIntervals = intervals.filter(i => i.type === 'lab');
      
      console.log(`\nNatural: ${naturalIntervals.length} intervals`);
      console.log(`Lab: ${labIntervals.length} intervals`);
      
      if (naturalIntervals.length > 0) {
        console.log('\nFirst 5 natural intervals:');
        naturalIntervals.slice(0, 5).forEach(interval => {
          console.log(`  ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x multiplier`);
        });
      }
    }
    
    // Check exchange rates
    console.log('\n=== CHECKING EXCHANGE RATES ===');
    
    const rates = await prisma.exchangeRate.findMany({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'SEK'
      },
      orderBy: { validFrom: 'desc' },
      take: 3
    });
    
    if (rates.length === 0) {
      console.log('❌ NO USD→SEK EXCHANGE RATES FOUND!');
    } else {
      console.log(`✅ Found ${rates.length} recent USD→SEK rates:`);
      rates.forEach(rate => {
        console.log(`  ${rate.rate} (valid from ${rate.validFrom})`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMarkupIntervals();