import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Import diamonds from the sample CSV files to test the pricing system
async function importFromSamples() {
  console.log('=== IMPORTING FROM SAMPLE CSV FILES ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // Get pricing components
    const exchangeRate = await prisma.exchangeRate.findFirst({
      where: {
        fromCurrency: 'USD',
        toCurrency: 'SEK',
        validUntil: null
      },
      orderBy: { validFrom: 'desc' }
    });
    
    const naturalIntervals = await prisma.markupInterval.findMany({
      where: { type: 'natural' },
      orderBy: { minCarat: 'asc' }
    });
    
    if (!exchangeRate || naturalIntervals.length === 0) {
      console.log('❌ Missing pricing components');
      return;
    }
    
    console.log(`✅ Exchange rate: ${exchangeRate.rate}`);
    console.log(`✅ Natural intervals: ${naturalIntervals.length}`);
    
    // Read and parse sample natural diamonds
    const naturalCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/natural-large-sample.csv', 'utf8');
    const lines = naturalCSV.split('\\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    console.log(`\\nProcessing ${lines.length - 1} sample natural diamonds...`);
    
    // Create header mapping
    const headerMapping = {
      'Item ID #': 'itemId',
      'Supplier Stock Ref.': 'supplierStockRef',
      'Cut': 'cut',
      'Carat': 'carat',
      'Color': 'color',
      'Clarity': 'clarity',
      'Cut Grade': 'cutGrade',
      'Grading Lab': 'gradingLab',
      'Certificate Number': 'certificateNumber',
      'Price Per Carat': 'pricePerCarat',
      'Total Price': 'totalPrice'
    };
    
    const caratRanges = naturalIntervals.map(interval => ({
      min: interval.minCarat,
      max: interval.maxCarat,
      multiplier: interval.multiplier,
    }));
    
    let imported = 0;
    let skipped = 0;
    
    // Process first 10 diamonds as test
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
      const values = lines[i].split(',');
      
      if (values.length < headers.length) {
        skipped++;
        continue;
      }
      
      // Parse diamond data
      const diamond = { type: 'natural' };
      
      headers.forEach((header, index) => {
        const fieldName = headerMapping[header];
        if (fieldName && values[index]) {
          let value = values[index].trim();
          
          // Convert numeric fields
          if (['pricePerCarat', 'totalPrice', 'carat'].includes(fieldName)) {
            value = value === '' ? null : parseFloat(value) || null;
          }
          
          diamond[fieldName] = value;
        }
      });
      
      // Skip diamonds without essential data
      if (!diamond.itemId || !diamond.totalPrice || !diamond.carat) {
        console.log(`   Skipping diamond ${diamond.itemId}: missing essential data`);
        skipped++;
        continue;
      }
      
      // Apply pricing calculations
      const totalPriceSek = diamond.totalPrice * exchangeRate.rate;
      
      // Find markup multiplier
      const range = caratRanges.find((range, index) => {
        if (index === caratRanges.length - 1) {
          return diamond.carat >= range.min && diamond.carat <= range.max;
        } else {
          return diamond.carat >= range.min && diamond.carat < range.max;
        }
      });
      
      const multiplier = range ? range.multiplier : 1.0;
      const priceWithMarkupSek = totalPriceSek * multiplier;
      const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
      
      diamond.totalPriceSek = totalPriceSek;
      diamond.priceWithMarkupSek = priceWithMarkupSek;
      diamond.finalPriceSek = finalPriceSek;
      
      console.log(`   Processing ${diamond.itemId}: $${diamond.totalPrice} → ${finalPriceSek} SEK (${multiplier}x)`);
      
      // Check if diamond already exists
      const existing = await prisma.diamond.findUnique({
        where: { itemId: `SAMPLE-${diamond.itemId}` }
      });
      
      if (existing) {
        console.log(`   ⚠️ Diamond SAMPLE-${diamond.itemId} already exists, skipping`);
        continue;
      }
      
      // Insert diamond with SAMPLE- prefix to avoid conflicts
      await prisma.diamond.create({
        data: {
          itemId: `SAMPLE-${diamond.itemId}`,
          supplierStockRef: diamond.supplierStockRef,
          cut: diamond.cut,
          carat: diamond.carat,
          color: diamond.color,
          clarity: diamond.clarity,
          cutGrade: diamond.cutGrade,
          gradingLab: diamond.gradingLab,
          certificateNumber: diamond.certificateNumber,
          pricePerCarat: diamond.pricePerCarat,
          totalPrice: diamond.totalPrice,
          totalPriceSek: diamond.totalPriceSek,
          priceWithMarkupSek: diamond.priceWithMarkupSek,
          finalPriceSek: diamond.finalPriceSek,
          type: 'natural'
        }
      });
      
      imported++;
    }
    
    console.log(`\\n✅ Import complete: ${imported} diamonds imported, ${skipped} skipped`);
    
    // Test API call
    console.log('\\nTesting API with sample diamonds...');
    console.log('Try this URL:');
    console.log('http://127.0.0.1:9293/apps/api/diamonds/all?type=natural&limit=10&minPriceSek=1000&maxPriceSek=50000');
    
  } catch (error) {
    console.error('Error importing from samples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importFromSamples();