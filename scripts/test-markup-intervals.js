import { PrismaClient } from '@prisma/client';

// Copy the function to avoid import issues
async function getMarkupIntervals(type, prisma) {
  try {
    const intervals = await prisma.markupInterval.findMany({
      where: { type },
      orderBy: { minCarat: 'asc' },
    });

    const caratRanges = intervals.map((interval) => ({
      min: interval.minCarat,
      max: interval.maxCarat,
      multiplier: interval.multiplier,
    }));

    console.log(`[MARKUP INTERVALS] Loaded ${caratRanges.length} fresh intervals for ${type} diamonds`);
    return caratRanges;
  } catch (error) {
    console.error(`[MARKUP INTERVALS] Error fetching intervals for ${type}:`, error);
    
    // Return fallback intervals if database is unavailable
    return getFallbackIntervals(type);
  }
}

function getFallbackIntervals(type) {
  console.warn(`[MARKUP INTERVALS] Using fallback intervals for ${type} diamonds`);
  
  // Return granular 0.1 carat intervals with 1.0 multiplier as fallback
  const intervals = [];
  
  for (let i = 0; i < 50; i++) {
    const minCarat = i * 0.1;
    const maxCarat = minCarat + 0.09;
    
    // Special case for last interval to go up to 5.00
    if (i === 49) {
      intervals.push({ min: 4.9, max: 5.0, multiplier: 1.0 });
    } else {
      intervals.push({ min: minCarat, max: maxCarat, multiplier: 1.0 });
    }
  }
  
  return intervals;
}

async function testMarkupIntervals() {
  console.log('=== TESTING MARKUP INTERVAL FUNCTIONALITY ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Test direct database query
    console.log('1. Testing direct database markup intervals...');
    
    const naturalIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' },
      take: 10
    });
    
    const labIntervals = await prisma.markupInterval.findMany({
      where: { type: 'lab' },
      orderBy: { minCarat: 'asc' },
      take: 10
    });
    
    console.log(`✅ Found ${naturalIntervals.length} natural intervals (showing first 10):`);
    naturalIntervals.forEach((interval, i) => {
      console.log(`   ${i + 1}. ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x multiplier`);
    });
    
    console.log(`\n✅ Found ${labIntervals.length} lab intervals (showing first 10):`);
    labIntervals.forEach((interval, i) => {
      console.log(`   ${i + 1}. ${interval.minCarat}-${interval.maxCarat} carat: ${interval.multiplier}x multiplier`);
    });
    
    // 2. Test service layer (what import actually uses)
    console.log('\n2. Testing markup intervals service...');
    
    try {
      console.log('   Testing natural diamond intervals...');
      const naturalMarkupRanges = await getMarkupIntervals('natural', prisma);
      console.log(`   ✅ Service returned ${naturalMarkupRanges.length} natural intervals`);
      
      if (naturalMarkupRanges.length > 0) {
        console.log('   First 5 intervals:');
        naturalMarkupRanges.slice(0, 5).forEach((range, i) => {
          console.log(`     ${i + 1}. ${range.min}-${range.max} carat: ${range.multiplier}x`);
        });
      }
      
      console.log('\n   Testing lab diamond intervals...');
      const labMarkupRanges = await getMarkupIntervals('lab', prisma);
      console.log(`   ✅ Service returned ${labMarkupRanges.length} lab intervals`);
      
      if (labMarkupRanges.length > 0) {
        console.log('   First 5 intervals:');
        labMarkupRanges.slice(0, 5).forEach((range, i) => {
          console.log(`     ${i + 1}. ${range.min}-${range.max} carat: ${range.multiplier}x`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Service error: ${error.message}`);
    }
    
    // 3. Test markup multiplier lookup for specific carats
    console.log('\n3. Testing markup multiplier lookup...');
    
    const testCarats = [0.25, 0.5, 1.0, 1.5, 2.0, 2.5];
    const naturalRanges = await getMarkupIntervals('natural', prisma);
    
    if (naturalRanges.length > 0) {
      console.log('   Natural diamond multipliers:');
      testCarats.forEach(carat => {
        const range = naturalRanges.find((r, index) => {
          if (index === naturalRanges.length - 1) {
            return carat >= r.min && carat <= r.max;
          } else {
            return carat >= r.min && carat < r.max;
          }
        });
        
        const multiplier = range ? range.multiplier : 'NOT FOUND';
        const markup = range ? Math.round((range.multiplier - 1) * 100) : 'N/A';
        console.log(`     ${carat} carat → ${multiplier}x (${markup}% markup)`);
      });
    }
    
  } catch (error) {
    console.error('Error testing markup intervals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMarkupIntervals();