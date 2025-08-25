import { PrismaClient } from '@prisma/client';

async function fixMarkupIntervals() {
  console.log('=== FIXING MARKUP INTERVAL BOUNDARIES ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // The issue: ranges like 0.8-0.89 exclude the upper bound (0.89)
    // But the next range 0.9-0.99 starts at 0.9, leaving 0.89 uncovered
    
    // Solution: Change ranges to 0.8-0.899999, 0.9-0.999999, etc
    // OR use inclusive upper bounds for all except the last
    
    console.log('Current problematic ranges:');
    const currentRanges = await prisma.markupInterval.findMany({
      where: { 
        type: 'natural',
        minCarat: { gte: 0.8, lte: 1.0 }
      },
      orderBy: { minCarat: 'asc' }
    });
    
    currentRanges.forEach(range => {
      console.log(`  ${range.minCarat}-${range.maxCarat}: ${range.multiplier}x`);
    });
    
    console.log('\nFixing the boundary issue...');
    
    // Strategy: Adjust the maxCarat values to be just under the next range's minCarat
    // This ensures no gaps while maintaining the < logic
    
    const updates = [
      // Fix the 0.8-0.89 range to be 0.8-0.8999 so 0.89 is included
      // But actually, let's use a simpler approach: adjust to 0.899
      { minCarat: 0.8, maxCarat: 0.89, newMaxCarat: 0.899 },
      { minCarat: 0.9, maxCarat: 0.99, newMaxCarat: 0.999 },
      { minCarat: 1.0, maxCarat: 1.09, newMaxCarat: 1.099 },
      // Continue pattern for all ranges that might have boundary issues
    ];
    
    // Actually, let's use a more systematic approach
    // Get all natural intervals and fix them systematically
    const allNaturalRanges = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log('\nApproach 1: Adjusting maxCarat values to include upper bound');
    
    for (let i = 0; i < allNaturalRanges.length; i++) {
      const range = allNaturalRanges[i];
      const isLast = i === allNaturalRanges.length - 1;
      
      if (!isLast && range.maxCarat % 0.1 === 0.09) {
        // This range ends at .09, .19, .29, etc which creates boundary issues
        // Adjust to .099, .199, .299 to include the boundary values
        const newMaxCarat = range.maxCarat + 0.009;
        
        console.log(`  Updating ${range.minCarat}-${range.maxCarat} → ${range.minCarat}-${newMaxCarat}`);
        
        await prisma.markupInterval.updateMany({
          where: {
            type: 'natural',
            minCarat: range.minCarat,
            maxCarat: range.maxCarat
          },
          data: {
            maxCarat: newMaxCarat
          }
        });
      }
    }
    
    // Verify the fix
    console.log('\nVerifying fix...');
    const updatedRanges = await prisma.markupInterval.findMany({
      where: { 
        type: 'natural',
        minCarat: { gte: 0.8, lte: 1.0 }
      },
      orderBy: { minCarat: 'asc' }
    });
    
    console.log('Updated ranges:');
    updatedRanges.forEach(range => {
      console.log(`  ${range.minCarat}-${range.maxCarat}: ${range.multiplier}x`);
    });
    
    // Test the fix with 0.89 carat
    console.log('\nTesting 0.89 carat lookup...');
    const testCarat = 0.89;
    
    const allUpdatedRanges = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    const caratRanges = allUpdatedRanges.map(interval => ({
      min: interval.minCarat,
      max: interval.maxCarat,
      multiplier: interval.multiplier,
    }));
    
    const foundRange = caratRanges.find((range, index) => {
      if (index === caratRanges.length - 1) {
        return testCarat >= range.min && testCarat <= range.max;
      } else {
        return testCarat >= range.min && testCarat < range.max;
      }
    });
    
    if (foundRange) {
      console.log(`✅ SUCCESS: 0.89 carat now maps to ${foundRange.min}-${foundRange.max} = ${foundRange.multiplier}x`);
    } else {
      console.log(`❌ STILL BROKEN: 0.89 carat still has no matching range`);
    }
    
  } catch (error) {
    console.error('Error fixing markup intervals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixMarkupIntervals();