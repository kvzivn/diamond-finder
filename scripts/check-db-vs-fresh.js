import { PrismaClient } from '@prisma/client';
import fs from 'fs';

async function checkDbVsFresh() {
  console.log('=== CHECKING DATABASE VS FRESH DATA ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Get a few diamonds from database
    console.log('1. Getting diamonds from database...');
    const dbDiamonds = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 10,
      select: {
        itemId: true,
        carat: true,
        pricePerCarat: true,
        totalPrice: true,
        color: true,
        clarity: true,
      }
    });
    
    console.log(`Found ${dbDiamonds.length} diamonds in database`);
    
    // 2. Get fresh data
    console.log('2. Reading fresh sample data...');
    const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const pricePerCaratIndex = headers.indexOf('Price Per Carat');
    const totalPriceIndex = headers.indexOf('Total Price');
    const itemIdIndex = headers.indexOf('Item ID #');
    const caratIndex = headers.indexOf('Carat');
    
    // Parse first 10 fresh diamonds
    const freshDiamonds = [];
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
      const values = lines[i].split(',');
      freshDiamonds.push({
        itemId: values[itemIdIndex],
        carat: parseFloat(values[caratIndex]),
        pricePerCarat: parseFloat(values[pricePerCaratIndex]),
        totalPrice: parseFloat(values[totalPriceIndex])
      });
    }
    
    console.log('\n3. Comparing data:');
    console.log('\nDatabase diamonds:');
    dbDiamonds.forEach((d, i) => {
      console.log(`  ${i+1}. ${d.itemId}: ${d.carat} carat, PPC=${d.pricePerCarat}, Total=${d.totalPrice}`);
    });
    
    console.log('\nFresh diamonds:');
    freshDiamonds.forEach((d, i) => {
      console.log(`  ${i+1}. ${d.itemId}: ${d.carat} carat, PPC=${d.pricePerCarat}, Total=${d.totalPrice}`);
    });
    
    // 4. Check if any fresh diamonds exist in database
    console.log('\n4. Looking for matches...');
    let matches = 0;
    for (const freshDiamond of freshDiamonds) {
      const dbMatch = dbDiamonds.find(db => db.itemId === freshDiamond.itemId);
      if (dbMatch) {
        matches++;
        console.log(`✅ MATCH: ${freshDiamond.itemId}`);
        console.log(`  Fresh: PPC=${freshDiamond.pricePerCarat}, Total=${freshDiamond.totalPrice}`);
        console.log(`  DB:    PPC=${dbMatch.pricePerCarat}, Total=${dbMatch.totalPrice}`);
        
        if (freshDiamond.totalPrice && !dbMatch.totalPrice) {
          console.log(`  ❌ PRICE LOST: Fresh has ${freshDiamond.totalPrice}, DB has null`);
        }
      }
    }
    
    console.log(`\nFound ${matches} matches out of ${freshDiamonds.length} fresh diamonds`);
    
    if (matches === 0) {
      console.log('\n❌ NO MATCHES: Database has completely different diamonds than fresh data');
      console.log('This means either:');
      console.log('  1. Import happened at different time with different IDEX data');
      console.log('  2. Import process filters out these diamonds');
      console.log('  3. Database was cleared and re-imported');
    }
    
    // 5. Check database statistics
    console.log('\n5. Database statistics:');
    const stats = await prisma.diamond.aggregate({
      where: { type: 'natural' },
      _count: {
        _all: true,
        totalPrice: true,
        pricePerCarat: true
      }
    });
    
    console.log(`  Total natural diamonds: ${stats._count._all}`);
    console.log(`  With totalPrice: ${stats._count.totalPrice}`);
    console.log(`  With pricePerCarat: ${stats._count.pricePerCarat}`);
    console.log(`  Missing prices: ${stats._count._all - stats._count.totalPrice}`);
    console.log(`  Price fill rate: ${((stats._count.totalPrice / stats._count._all) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('Error checking database vs fresh:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDbVsFresh();