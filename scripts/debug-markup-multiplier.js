import { PrismaClient } from '@prisma/client';

async function debugMarkupMultiplier() {
  console.log('=== DEBUGGING MARKUP MULTIPLIER ISSUE ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get natural intervals around 0.89 carat
    const naturalIntervals = await prisma.markupInterval.findMany({
      where: { 
        type: 'natural',
        minCarat: { lte: 0.89 },
        maxCarat: { gte: 0.89 }
      },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log('Natural intervals that should cover 0.89 carat:');
    naturalIntervals.forEach(interval => {
      console.log(`  ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x`);
    });
    
    // Get all intervals around that range
    const allNaturalIntervals = await prisma.markupInterval.findMany({
      where: { 
        type: 'natural',
        minCarat: { gte: 0.8, lte: 1.0 }
      },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log('\nAll natural intervals from 0.8-1.0 carat:');
    allNaturalIntervals.forEach(interval => {
      const covers089 = (0.89 >= interval.minCarat && 0.89 < interval.maxCarat) || 
                        (interval.minCarat === allNaturalIntervals[allNaturalIntervals.length - 1].minCarat && 0.89 <= interval.maxCarat);
      console.log(`  ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x ${covers089 ? '← COVERS 0.89' : ''}`);
    });
    
    // Test the exact lookup logic
    console.log('\n=== TESTING LOOKUP LOGIC ===');
    
    const testCarat = 0.89;
    const allIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log(`Looking for multiplier for ${testCarat} carat...`);
    
    const matchedInterval = allIntervals.find((interval, index) => {
      const isLast = index === allIntervals.length - 1;
      const matches = isLast ? 
        (testCarat >= interval.minCarat && testCarat <= interval.maxCarat) :
        (testCarat >= interval.minCarat && testCarat < interval.maxCarat);
        
      if (matches) {
        console.log(`  ✅ MATCH: ${interval.minCarat}-${interval.maxCarat} (${interval.multiplier}x) [Last: ${isLast}]`);
      }
      return matches;
    });
    
    if (!matchedInterval) {
      console.log('  ❌ NO MATCH FOUND - this causes 0x multiplier!');
      
      // Show closest intervals
      const below = allIntervals.filter(i => i.maxCarat < testCarat).slice(-2);
      const above = allIntervals.filter(i => i.minCarat > testCarat).slice(0, 2);
      
      console.log('  Closest intervals below:');
      below.forEach(i => console.log(`    ${i.minCarat}-${i.maxCarat}: ${i.multiplier}x`));
      
      console.log('  Closest intervals above:');
      above.forEach(i => console.log(`    ${i.minCarat}-${i.maxCarat}: ${i.multiplier}x`));
      
      // Check for gap
      const lastBelow = below[below.length - 1];
      const firstAbove = above[0];
      if (lastBelow && firstAbove) {
        console.log(`  ❌ GAP DETECTED: ${lastBelow.maxCarat} → ${firstAbove.minCarat}`);
        console.log(`    Missing coverage for ${testCarat} carat`);
      }
    } else {
      console.log(`  Result: ${matchedInterval.multiplier}x multiplier`);
    }
    
    // Test a few more problematic carats
    console.log('\n=== TESTING OTHER CARATS ===');
    const testCarats = [0.1, 0.5, 0.85, 0.89, 0.9, 1.0, 1.5, 2.0];
    
    testCarats.forEach(carat => {
      const match = allIntervals.find((interval, index) => {
        if (index === allIntervals.length - 1) {
          return carat >= interval.minCarat && carat <= interval.maxCarat;
        } else {
          return carat >= interval.minCarat && carat < interval.maxCarat;
        }
      });
      
      console.log(`  ${carat} carat: ${match ? match.multiplier + 'x' : 'NO MATCH'}`);
    });
    
  } catch (error) {
    console.error('Error debugging markup multiplier:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugMarkupMultiplier();