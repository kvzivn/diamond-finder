import { PrismaClient } from '@prisma/client';

async function checkRecentImportLogs() {
  console.log('=== CHECKING RECENT IMPORT LOGS ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get the most recent import jobs
    const recentJobs = await prisma.importJob.findMany({
      orderBy: { startedAt: 'desc' },
      take: 5
    });
    
    console.log(`Found ${recentJobs.length} recent import jobs:\n`);
    
    recentJobs.forEach((job, index) => {
      console.log(`=== JOB ${index + 1} ===`);
      console.log(`ID: ${job.id}`);
      console.log(`Type: ${job.type}`);
      console.log(`Status: ${job.status}`);
      console.log(`Started: ${job.startedAt}`);
      console.log(`Completed: ${job.completedAt || 'Still running'}`);
      console.log(`Records Processed: ${job.recordsProcessed || 0}`);
      console.log(`Records Created: ${job.recordsCreated || 0}`);
      console.log(`Records Updated: ${job.recordsUpdated || 0}`);
      console.log(`Records Skipped: ${job.recordsSkipped || 0}`);
      console.log(`Error Message: ${job.errorMessage || 'None'}`);
      console.log(`Notes: ${job.notes || 'None'}`);
      console.log('');
    });
    
    // Focus on the most recent natural import
    const recentNaturalJob = recentJobs.find(job => job.type === 'natural');
    
    if (recentNaturalJob) {
      console.log(`=== MOST RECENT NATURAL IMPORT DETAILS ===`);
      console.log(`ID: ${recentNaturalJob.id}`);
      console.log(`Status: ${recentNaturalJob.status}`);
      console.log(`Started: ${recentNaturalJob.startedAt}`);
      console.log(`Completed: ${recentNaturalJob.completedAt}`);
      console.log(`Records Processed: ${recentNaturalJob.recordsProcessed}`);
      console.log(`Records Created: ${recentNaturalJob.recordsCreated}`);
      console.log(`Records Updated: ${recentNaturalJob.recordsUpdated}`);
      console.log(`Records Skipped: ${recentNaturalJob.recordsSkipped}`);
      console.log(`Error: ${recentNaturalJob.errorMessage || 'None'}`);
      console.log(`Notes: ${recentNaturalJob.notes || 'None'}`);
      
      if (recentNaturalJob.recordsProcessed === 0) {
        console.log('\\n🔍 ISSUE: 0 records processed - this suggests:');
        console.log('  1. IDEX API returned no data');
        console.log('  2. ZIP extraction failed');
        console.log('  3. CSV parsing failed before any rows');
        console.log('  4. API request failed entirely');
      }
      
      if (recentNaturalJob.recordsProcessed > 0 && recentNaturalJob.recordsCreated === 0) {
        console.log('\\n🔍 ISSUE: Records processed but none created - this suggests:');
        console.log('  1. All records failed validation');
        console.log('  2. All records were duplicates');
        console.log('  3. Database constraints preventing insertion');
      }
    } else {
      console.log('❌ No recent natural diamond import jobs found');
    }
    
    // Check current diamond counts
    console.log('\\n=== CURRENT DATABASE STATE ===');
    
    const naturalCount = await prisma.diamond.count({
      where: { type: 'natural' }
    });
    
    const naturalWithPrices = await prisma.diamond.count({
      where: { 
        type: 'natural',
        totalPrice: { not: null },
        finalPriceSek: { not: null }
      }
    });
    
    console.log(`Natural diamonds in DB: ${naturalCount}`);
    console.log(`Natural diamonds with prices: ${naturalWithPrices}`);
    
  } catch (error) {
    console.error('Error checking import logs:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentImportLogs();