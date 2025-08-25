import { PrismaClient } from '@prisma/client';

async function debugImportFailures() {
  console.log('=== DEBUGGING IMPORT FAILURES ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Check the import job details
    console.log('1. Getting import job details...');
    const recentJobs = await prisma.importJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${recentJobs.length} recent import jobs:`);
    recentJobs.forEach((job, i) => {
      console.log(`\n${i+1}. Job ${job.id}:`);
      console.log(`   Type: ${job.type}`);
      console.log(`   Status: ${job.status}`);
      console.log(`   Started: ${job.startedAt}`);
      console.log(`   Completed: ${job.completedAt}`);
      console.log(`   Processed: ${job.processedCount}`);
      console.log(`   Inserted: ${job.insertedCount}`);
      console.log(`   Error Count: ${job.errorCount}`);
      console.log(`   Error Message: ${job.errorMessage || 'None'}`);
    });
    
    // 2. Check actual lab diamonds in database
    console.log('\n2. Checking lab diamonds in database...');
    const labStats = await prisma.diamond.aggregate({
      where: { type: 'lab' },
      _count: {
        _all: true,
        totalPrice: true,
        pricePerCarat: true
      }
    });
    
    console.log(`Lab diamonds in database: ${labStats._count._all}`);
    console.log(`Lab diamonds with totalPrice: ${labStats._count.totalPrice}`);
    console.log(`Lab diamonds with pricePerCarat: ${labStats._count.pricePerCarat}`);
    
    if (labStats._count._all > 0) {
      const sampleLab = await prisma.diamond.findMany({
        where: { type: 'lab' },
        take: 5,
        select: {
          itemId: true,
          carat: true,
          totalPrice: true,
          pricePerCarat: true,
          totalPriceSek: true,
          finalPriceSek: true,
          color: true,
          clarity: true,
          cut: true
        }
      });
      
      console.log('\nFirst 5 lab diamonds:');
      sampleLab.forEach((diamond, i) => {
        console.log(`${i+1}. ${diamond.itemId}: ${diamond.carat} carat, $${diamond.totalPrice} → ${diamond.finalPriceSek} SEK`);
      });
    }
    
    // 3. Test the API query that's failing
    console.log('\n3. Testing the failing API query parameters...');
    const apiParams = {
      type: 'natural',
      shape: 'Round',
      minPriceSek: 2500,
      maxPriceSek: 1000000,
      minCarat: 0.3,
      maxCarat: 5,
      minColour: 'K',
      maxColour: 'D',
      minClarity: 'SI2',
      maxClarity: 'FL',
      minCutGrade: 'Good',
      maxCutGrade: 'Excellent',
      gradingLab: ['GIA', 'IGI', 'HRD']
    };
    
    console.log('API query params:', apiParams);
    
    // Build the where clause like the API does
    const whereClause = {
      type: apiParams.type,
      finalPriceSek: {
        gte: apiParams.minPriceSek,
        lte: apiParams.maxPriceSek
      },
      carat: {
        gte: apiParams.minCarat,
        lte: apiParams.maxCarat
      }
    };
    
    // Add shape filter
    if (apiParams.shape) {
      whereClause.cut = apiParams.shape;
    }
    
    // Add color filter (this might be the issue)
    if (apiParams.minColour && apiParams.maxColour) {
      const colorOrder = ['D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M'];
      const minIndex = colorOrder.indexOf(apiParams.minColour);
      const maxIndex = colorOrder.indexOf(apiParams.maxColour);
      
      if (minIndex > maxIndex) {
        console.log(`❌ COLOR FILTER ERROR: minColour=${apiParams.minColour} (${minIndex}) > maxColour=${apiParams.maxColour} (${maxIndex})`);
        console.log('This would result in NO matches because the filter is backwards!');
      }
    }
    
    // Test the query
    console.log('\n4. Testing database query with API parameters...');
    const matchingDiamonds = await prisma.diamond.count({
      where: whereClause
    });
    
    console.log(`Diamonds matching API query: ${matchingDiamonds}`);
    
    // Test without filters
    const allNatural = await prisma.diamond.count({
      where: { type: 'natural' }
    });
    
    const naturalWithPrices = await prisma.diamond.count({
      where: { 
        type: 'natural',
        finalPriceSek: { not: null }
      }
    });
    
    console.log(`Total natural diamonds: ${allNatural}`);
    console.log(`Natural diamonds with finalPriceSek: ${naturalWithPrices}`);
    
    if (naturalWithPrices === 0) {
      console.log('\n❌ CRITICAL: NO natural diamonds have finalPriceSek!');
      console.log('This means the pricing calculation failed during import.');
    }
    
    // 5. Check for diamonds that flash and disappear
    console.log('\n5. Investigating flashing diamonds issue...');
    
    // Check if any diamonds exist but get filtered out by price range
    const allNaturalSample = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 5,
      select: {
        itemId: true,
        finalPriceSek: true,
        totalPrice: true,
        carat: true,
        cut: true,
        color: true,
        clarity: true
      }
    });
    
    console.log('Sample natural diamonds (any price range):');
    allNaturalSample.forEach((d, i) => {
      console.log(`${i+1}. ${d.itemId}: ${d.finalPriceSek} SEK, ${d.carat} carat, ${d.cut}, ${d.color}, ${d.clarity}`);
      
      // Check if this would match the API filters
      const matchesPrice = d.finalPriceSek >= 2500 && d.finalPriceSek <= 1000000;
      const matchesCarat = d.carat >= 0.3 && d.carat <= 5;
      const matchesShape = d.cut === 'Round';
      
      console.log(`   Matches filters: price=${matchesPrice}, carat=${matchesCarat}, shape=${matchesShape}`);
    });
    
  } catch (error) {
    console.error('Error debugging import failures:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugImportFailures();