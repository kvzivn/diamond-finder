import { PrismaClient } from '@prisma/client';

async function testFreshImportNow() {
  console.log('=== TESTING FRESH IMPORT NOW ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Clear existing natural diamonds to have a clean slate
    console.log('1. Clearing existing natural diamonds...');
    const deleteResult = await prisma.diamond.deleteMany({
      where: { type: 'natural' }
    });
    console.log(`Cleared ${deleteResult.count} existing natural diamonds\n`);
    
    // Trigger a fresh natural diamond import
    console.log('2. Triggering fresh natural diamond import...');
    const importResponse = await fetch('http://127.0.0.1:9293/admin/trigger-refresh-partial', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'natural',
        adminToken: 'test-admin-token-123'
      })
    });
    
    if (!importResponse.ok) {
      console.log(`❌ Failed to trigger import: ${importResponse.status}`);
      return;
    }
    
    console.log('✅ Import triggered successfully\n');
    
    // Wait and monitor the import progress
    console.log('3. Monitoring import progress...');
    
    for (let i = 0; i < 30; i++) { // Wait up to 5 minutes
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      // Check import job status
      const recentJob = await prisma.importJob.findFirst({
        where: { type: 'natural' },
        orderBy: { startedAt: 'desc' }
      });
      
      if (recentJob && recentJob.status === 'COMPLETED') {
        console.log(`✅ Import completed after ${i + 1} checks`);
        
        // Check results immediately
        const naturalStats = await prisma.diamond.aggregate({
          where: { type: 'natural' },
          _count: {
            _all: true,
            totalPrice: true,
            finalPriceSek: true
          }
        });
        
        console.log(`\nImport Results:`);
        console.log(`  Total natural diamonds: ${naturalStats._count._all}`);
        console.log(`  With USD totalPrice: ${naturalStats._count.totalPrice}`);
        console.log(`  With final SEK prices: ${naturalStats._count.finalPriceSek}`);
        
        const priceSuccessRate = naturalStats._count._all > 0 ? 
          (naturalStats._count.totalPrice / naturalStats._count._all * 100).toFixed(1) : 0;
        
        console.log(`  Price success rate: ${priceSuccessRate}%`);
        
        if (naturalStats._count.totalPrice > 0) {
          console.log(`\n✅ FRESH IDEX DATA HAS PRICES!`);
          
          // Show sample diamonds with prices
          const sampleWithPrices = await prisma.diamond.findMany({
            where: { 
              type: 'natural',
              totalPrice: { not: null }
            },
            take: 5,
            select: {
              itemId: true,
              totalPrice: true,
              finalPriceSek: true,
              carat: true,
              color: true,
              clarity: true
            }
          });
          
          console.log('\nSample diamonds with prices:');
          sampleWithPrices.forEach((d, i) => {
            console.log(`  ${i+1}. ${d.itemId}: $${d.totalPrice} → ${d.finalPriceSek} SEK (${d.carat} carat, ${d.color}, ${d.clarity})`);
          });
          
        } else {
          console.log(`\n❌ FRESH IDEX DATA STILL MISSING PRICES`);
          console.log('This would mean IDEX API is currently not providing price data.');
          
          // Show sample diamonds without prices
          const sampleWithoutPrices = await prisma.diamond.findMany({
            where: { 
              type: 'natural'
            },
            take: 5,
            select: {
              itemId: true,
              totalPrice: true,
              carat: true,
              color: true,
              clarity: true
            }
          });
          
          console.log('\nSample diamonds without prices:');
          sampleWithoutPrices.forEach((d, i) => {
            console.log(`  ${i+1}. ${d.itemId}: $${d.totalPrice} (${d.carat} carat, ${d.color}, ${d.clarity})`);
          });
        }
        
        break;
        
      } else if (recentJob && recentJob.status === 'FAILED') {
        console.log(`❌ Import failed: ${recentJob.errorMessage}`);
        break;
        
      } else {
        console.log(`⏳ Import still running... (check ${i + 1}/30)`);
      }
    }
    
  } catch (error) {
    console.error('Error testing fresh import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFreshImportNow();