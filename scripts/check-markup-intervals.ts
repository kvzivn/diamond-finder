import prisma from '../app/db.server';

async function checkMarkupIntervals() {
  try {
    const naturalCount = await prisma.markupInterval.count({
      where: { type: 'natural' }
    });
    
    const labCount = await prisma.markupInterval.count({
      where: { type: 'lab' }
    });
    
    console.log(`Natural diamond intervals: ${naturalCount}`);
    console.log(`Lab diamond intervals: ${labCount}`);
    
    if (naturalCount === 0 && labCount === 0) {
      console.log('\nNo markup intervals found in database.');
      console.log('Visit /admin/markup-intervals to seed default intervals.');
    } else {
      const naturalIntervals = await prisma.markupInterval.findMany({
        where: { type: 'natural' },
        orderBy: { minCarat: 'asc' },
        take: 5
      });
      
      console.log('\nSample natural diamond intervals:');
      naturalIntervals.forEach(interval => {
        console.log(`  ${interval.minCarat}-${interval.maxCarat} ct: ${interval.multiplier}x`);
      });
    }
  } catch (error) {
    console.error('Error checking markup intervals:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMarkupIntervals();