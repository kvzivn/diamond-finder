import { PrismaClient } from '@prisma/client';

async function findTheOneDiamond() {
  console.log('=== FINDING THE ONE DIAMOND WITH PRICES ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Find the diamond(s) that actually have prices
    const diamondsWithPrices = await prisma.diamond.findMany({
      where: { 
        type: 'natural',
        totalPrice: { not: null }
      },
      select: {
        itemId: true,
        carat: true,
        pricePerCarat: true,
        totalPrice: true,
        totalPriceSek: true,
        finalPriceSek: true,
        color: true,
        clarity: true,
        cut: true,
        cutGrade: true
      }
    });
    
    console.log(`Found ${diamondsWithPrices.length} natural diamonds with prices:`);
    
    diamondsWithPrices.forEach((diamond, i) => {
      console.log(`\n${i+1}. Diamond ${diamond.itemId}:`);
      console.log(`   Carat: ${diamond.carat}`);
      console.log(`   Color: ${diamond.color}`);
      console.log(`   Clarity: ${diamond.clarity}`);
      console.log(`   Cut: ${diamond.cut}`);
      console.log(`   Cut Grade: ${diamond.cutGrade}`);
      console.log(`   Price Per Carat: $${diamond.pricePerCarat}`);
      console.log(`   Total Price: $${diamond.totalPrice}`);
      console.log(`   Total Price SEK: ${diamond.totalPriceSek}`);
      console.log(`   Final Price SEK: ${diamond.finalPriceSek}`);
    });
    
    // Also check a few diamonds WITHOUT prices for comparison
    console.log('\n=== COMPARING WITH DIAMONDS WITHOUT PRICES ===');
    
    const diamondsWithoutPrices = await prisma.diamond.findMany({
      where: { 
        type: 'natural',
        totalPrice: null
      },
      take: 3,
      select: {
        itemId: true,
        carat: true,
        pricePerCarat: true,
        totalPrice: true,
        color: true,
        clarity: true,
        cut: true
      }
    });
    
    console.log(`\nFirst 3 natural diamonds WITHOUT prices:`);
    diamondsWithoutPrices.forEach((diamond, i) => {
      console.log(`\n${i+1}. Diamond ${diamond.itemId}:`);
      console.log(`   Carat: ${diamond.carat}`);
      console.log(`   Color: ${diamond.color}`);
      console.log(`   Clarity: ${diamond.clarity}`);
      console.log(`   Cut: ${diamond.cut}`);
      console.log(`   Price Per Carat: ${diamond.pricePerCarat} (should be null)`);
      console.log(`   Total Price: ${diamond.totalPrice} (null)`);
    });
    
    console.log('\n=== ANALYSIS ===');
    if (diamondsWithPrices.length === 1) {
      console.log('Only 1 diamond has prices - this suggests:');
      console.log('1. Most diamonds in the CSV had empty price fields');
      console.log('2. OR the CSV parsing failed for most rows');
      console.log('3. OR there was a data processing error during import');
    }
    
  } catch (error) {
    console.error('Error finding diamonds with prices:', error);
  } finally {
    await prisma.$disconnect();
  }
}

findTheOneDiamond();