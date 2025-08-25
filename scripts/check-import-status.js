import { PrismaClient } from '@prisma/client';

async function checkImportStatus() {
  console.log('=== CHECKING IMPORT STATUS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get the most recent natural diamond import job
    const recentJob = await prisma.importJob.findFirst({
      where: { type: 'natural' },
      orderBy: { startedAt: 'desc' }
    });
    
    if (!recentJob) {
      console.log('No natural diamond import jobs found');
      return;
    }
    
    console.log(`Most recent natural import job:`);
    console.log(`  ID: ${recentJob.id}`);
    console.log(`  Status: ${recentJob.status}`);
    console.log(`  Started: ${recentJob.startedAt}`);
    console.log(`  Completed: ${recentJob.completedAt || 'Still running'}`);
    console.log(`  Error: ${recentJob.errorMessage || 'None'}`);
    
    // Check if import is still running
    if (recentJob.status === 'IN_PROGRESS') {
      console.log('\n⏳ Import is still running...');
      
      // Check how many diamonds we have now
      const currentCount = await prisma.diamond.count({
        where: { type: 'natural' }
      });
      console.log(`Current natural diamonds in DB: ${currentCount}`);
      
    } else if (recentJob.status === 'COMPLETED') {
      // Check the results
      console.log('\n✅ Import completed! Checking results...');
      
      const naturalStats = await prisma.diamond.aggregate({
        where: { type: 'natural' },
        _count: {
          _all: true,
          totalPrice: true,
          finalPriceSek: true
        }
      });
      
      console.log(`Natural diamond results:`);
      console.log(`  Total diamonds: ${naturalStats._count._all}`);
      console.log(`  With USD prices: ${naturalStats._count.totalPrice}`);
      console.log(`  With final SEK prices: ${naturalStats._count.finalPriceSek}`);
      
      const successRate = (naturalStats._count.totalPrice / naturalStats._count._all) * 100;
      console.log(`  Success rate: ${successRate.toFixed(1)}%`);
      
      if (naturalStats._count.totalPrice > 0) {
        // Test the API query
        console.log('\n🧪 Testing API query...');
        
        const testQuery = await prisma.diamond.count({
          where: {
            type: 'natural',
            finalPriceSek: {
              gte: 2500,
              lte: 1000000
            },
            carat: {
              gte: 0.3,
              lte: 5
            }
          }
        });
        
        console.log(`Diamonds matching API filters: ${testQuery}`);
        
        if (testQuery > 0) {
          console.log('🎉 API should now return diamonds!');
        } else {
          console.log('❌ Still no diamonds match API filters');
        }
      }
      
    } else if (recentJob.status === 'FAILED') {
      console.log('\n❌ Import failed!');
      console.log(`Error: ${recentJob.errorMessage}`);
    }
    
  } catch (error) {
    console.error('Error checking import status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkImportStatus();

// Run every 10 seconds if import is in progress
async function monitor() {
  const prisma = new PrismaClient();
  
  try {
    const runningJob = await prisma.importJob.findFirst({
      where: { 
        type: 'natural',
        status: 'IN_PROGRESS'
      }
    });
    
    if (runningJob) {
      console.log('\nImport still running... checking again in 10 seconds');
      setTimeout(monitor, 10000);
    }
  } catch (error) {
    console.error('Monitor error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setTimeout(monitor, 2000);