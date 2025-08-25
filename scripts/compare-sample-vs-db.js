import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Compare the sample data with what's actually in the database
async function compareSampleVsDatabase() {
  console.log('=== COMPARING SAMPLE DATA VS DATABASE ===\\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Read sample data
    console.log('1. Reading sample natural diamond CSV...');
    const naturalCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/natural-large-sample.csv', 'utf8');
    const lines = naturalCSV.split('\\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`   Sample has ${lines.length - 1} diamonds`);
    console.log(`   Headers: ${headers.slice(0, 10).join(', ')}...`);
    
    // Find price columns in sample
    const pricePerCaratIndex = headers.findIndex(h => h === 'Price Per Carat');
    const totalPriceIndex = headers.findIndex(h => h === 'Total Price');
    console.log(`   Price columns at indices: ${pricePerCaratIndex}, ${totalPriceIndex}`);
    
    // 2. Analyze sample data
    const sampleDiamonds = [];
    for (let i = 1; i <= Math.min(20, lines.length - 1); i++) {
      const values = lines[i].split(',');
      const diamond = {
        itemId: values[0],
        carat: parseFloat(values[3]) || null,
        pricePerCarat: parseFloat(values[pricePerCaratIndex]) || null,
        totalPrice: parseFloat(values[totalPriceIndex]) || null
      };
      sampleDiamonds.push(diamond);
    }
    
    console.log('\\n   First 5 sample diamonds:');
    sampleDiamonds.slice(0, 5).forEach((d, i) => {
      console.log(`     ${i+1}. ${d.itemId}: ${d.carat} carat, $${d.totalPrice}`);
    });
    
    // 3. Get database diamonds
    console.log('\\n2. Getting database natural diamonds...');
    const dbDiamonds = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 20,
      select: {
        itemId: true,
        carat: true,
        pricePerCarat: true,
        totalPrice: true,
        totalPriceSek: true,
        finalPriceSek: true
      }
    });
    
    console.log(`   Database has ${dbDiamonds.length} diamonds (showing first 20)`);
    console.log('\\n   First 5 database diamonds:');
    dbDiamonds.slice(0, 5).forEach((d, i) => {
      console.log(`     ${i+1}. ${d.itemId}: ${d.carat} carat, $${d.totalPrice} → ${d.finalPriceSek} SEK`);
    });
    
    // 4. Check if any sample diamonds exist in database
    console.log('\\n3. Checking if sample diamonds exist in database...');
    let matches = 0;
    let mismatches = 0;
    
    for (const sampleDiamond of sampleDiamonds.slice(0, 10)) {
      const dbMatch = dbDiamonds.find(db => db.itemId === sampleDiamond.itemId);
      
      if (dbMatch) {
        matches++;
        console.log(`   ✅ MATCH: ${sampleDiamond.itemId}`);
        console.log(`      Sample: ${sampleDiamond.carat} carat, $${sampleDiamond.totalPrice}`);
        console.log(`      DB: ${dbMatch.carat} carat, $${dbMatch.totalPrice}`);
        
        if (sampleDiamond.totalPrice && !dbMatch.totalPrice) {
          console.log(`      ❌ PRICE LOST: Sample had $${sampleDiamond.totalPrice}, DB has null`);
        }
      } else {
        mismatches++;
        console.log(`   ❌ NOT FOUND: ${sampleDiamond.itemId} (sample has $${sampleDiamond.totalPrice})`);
      }
    }
    
    console.log(`\\n   Results: ${matches} matches, ${mismatches} not found`);
    
    // 5. Check database diamond patterns
    console.log('\\n4. Analyzing database diamond patterns...');
    
    const dbStats = await prisma.diamond.aggregate({
      where: { type: 'natural' },
      _count: {
        _all: true,
        totalPrice: true,
        finalPriceSek: true
      }
    });
    
    console.log(`   Total natural diamonds in DB: ${dbStats._count._all}`);
    console.log(`   With USD prices: ${dbStats._count.totalPrice}`);
    console.log(`   With final SEK prices: ${dbStats._count.finalPriceSek}`);
    console.log(`   Missing USD prices: ${dbStats._count._all - dbStats._count.totalPrice}`);
    
    // 6. Check if different data was imported
    console.log('\\n5. Analysis conclusion...');
    
    if (matches === 0) {
      console.log('❌ CRITICAL: NO sample diamonds found in database!');
      console.log('   This means the import used COMPLETELY DIFFERENT data');
      console.log('   The production API returned different diamonds than the samples');
    } else if (matches > 0) {
      console.log(`✅ Found ${matches} matching diamonds`);
      console.log('   The import used similar data, but prices were lost during processing');
    }
    
    // 7. Recommendations
    console.log('\\n=== RECOMMENDATIONS ===');
    if (matches === 0) {
      console.log('1. The IDEX API returns different data at different times');
      console.log('2. Use the sample data to test import locally');  
      console.log('3. The current database has diamonds without price data');
      console.log('4. Need to import again when IDEX has price data available');
    } else {
      console.log('1. The diamonds match but prices were lost during CSV parsing');
      console.log('2. There may be a column mapping issue in the IDEX service');
      console.log('3. Re-run import with debug logging enabled');
    }
    
  } catch (error) {
    console.error('Error comparing data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareSampleVsDatabase();