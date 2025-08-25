import { PrismaClient } from '@prisma/client';

async function checkRawData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== CHECKING RAW DIAMOND DATA ===\n');
    
    // Get diamonds with all pricing fields
    const diamonds = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 10,
      select: {
        itemId: true,
        totalPrice: true,
        pricePerCarat: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true,
        carat: true,
        cut: true
      }
    });
    
    console.log('Raw data from first 10 natural diamonds:');
    diamonds.forEach((diamond, i) => {
      console.log(`\n${i + 1}. Diamond ${diamond.itemId}:`);
      console.log(`   Carat: ${diamond.carat}`);
      console.log(`   Shape: ${diamond.cut}`);
      console.log(`   Price per carat (USD): ${diamond.pricePerCarat}`);
      console.log(`   Total price (USD): ${diamond.totalPrice}`);
      console.log(`   Total price (SEK): ${diamond.totalPriceSek}`);
      console.log(`   Price with markup (SEK): ${diamond.priceWithMarkupSek}`);
      console.log(`   Final price (SEK): ${diamond.finalPriceSek}`);
    });
    
    // Count diamonds by pricing status
    const pricingStatus = await prisma.diamond.groupBy({
      by: ['type'],
      where: {},
      _count: {
        _all: true,
        totalPrice: true,
        totalPriceSek: true,
        finalPriceSek: true
      }
    });
    
    console.log('\n=== PRICING STATUS SUMMARY ===');
    pricingStatus.forEach(status => {
      console.log(`\n${status.type.toUpperCase()} diamonds:`);
      console.log(`  Total: ${status._count._all}`);
      console.log(`  With USD prices: ${status._count.totalPrice}`);
      console.log(`  With SEK prices: ${status._count.totalPriceSek}`);
      console.log(`  With final prices: ${status._count.finalPriceSek}`);
      
      const missingUSD = status._count._all - status._count.totalPrice;
      const missingSEK = status._count._all - status._count.totalPriceSek;
      const missingFinal = status._count._all - status._count.finalPriceSek;
      
      console.log(`  Missing USD prices: ${missingUSD}`);
      console.log(`  Missing SEK prices: ${missingSEK}`);
      console.log(`  Missing final prices: ${missingFinal}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkRawData();