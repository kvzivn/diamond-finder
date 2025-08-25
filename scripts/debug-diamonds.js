import { PrismaClient } from '@prisma/client';

async function debugDiamonds() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== DEBUGGING DIAMONDS ===\n');
    
    // Get 5 natural diamonds with their pricing info
    const naturalDiamonds = await prisma.diamond.findMany({
      where: { type: 'natural' },
      take: 5,
      select: {
        itemId: true,
        cut: true,
        carat: true,
        color: true,
        clarity: true,
        cutGrade: true,
        gradingLab: true,
        totalPrice: true,
        totalPriceSek: true,
        priceWithMarkupSek: true,
        finalPriceSek: true,
        type: true
      }
    });
    
    console.log(`Found ${naturalDiamonds.length} natural diamonds:`);
    naturalDiamonds.forEach((diamond, i) => {
      console.log(`\n${i + 1}. Diamond ${diamond.itemId}:`);
      console.log(`   Shape: ${diamond.cut}`);
      console.log(`   Carat: ${diamond.carat}`);
      console.log(`   Color: ${diamond.color}`);
      console.log(`   Clarity: ${diamond.clarity}`);
      console.log(`   Cut Grade: ${diamond.cutGrade}`);
      console.log(`   Grading Lab: ${diamond.gradingLab}`);
      console.log(`   USD Price: $${diamond.totalPrice}`);
      console.log(`   SEK Base: ${diamond.totalPriceSek} SEK`);
      console.log(`   SEK Markup: ${diamond.priceWithMarkupSek} SEK`);
      console.log(`   SEK Final: ${diamond.finalPriceSek} SEK`);
    });
    
    // Check what filters might be excluding them
    console.log('\n=== POTENTIAL FILTER ISSUES ===');
    
    // Check unique values for key filter fields
    const shapeCounts = await prisma.diamond.groupBy({
      by: ['cut'],
      where: { type: 'natural' },
      _count: { _all: true }
    });
    
    console.log('\nShapes in natural diamonds:');
    shapeCounts.forEach(shape => {
      console.log(`  ${shape.cut}: ${shape._count._all} diamonds`);
    });
    
    const colorCounts = await prisma.diamond.groupBy({
      by: ['color'],
      where: { type: 'natural' },
      _count: { _all: true }
    });
    
    console.log('\nColors in natural diamonds:');
    colorCounts.forEach(color => {
      console.log(`  ${color.color}: ${color._count._all} diamonds`);
    });
    
    // Check price ranges
    const priceStats = await prisma.diamond.aggregate({
      where: { 
        type: 'natural',
        finalPriceSek: { not: null }
      },
      _min: { finalPriceSek: true },
      _max: { finalPriceSek: true },
      _count: { finalPriceSek: true }
    });
    
    console.log('\nPrice statistics (final SEK prices):');
    console.log(`  Min: ${priceStats._min.finalPriceSek} SEK`);
    console.log(`  Max: ${priceStats._max.finalPriceSek} SEK`);
    console.log(`  Count with prices: ${priceStats._count.finalPriceSek}`);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDiamonds();