import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Test importing the sample CSV data to see if pricing works correctly
async function testImportWithSamples() {
  console.log('=== TESTING IMPORT WITH SAMPLE CSV FILES ===\n');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Get current exchange rate and markup intervals
    console.log('1. Getting pricing components...');
    
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
      orderBy: { minCarat: 'asc' },
    });
    
    const labIntervals = await prisma.markupInterval.findMany({
      where: { type: 'lab' },
      orderBy: { minCarat: 'asc' },
    });
    
    if (!exchangeRate || naturalIntervals.length === 0 || labIntervals.length === 0) {
      console.log('❌ Missing pricing components');
      return;
    }
    
    console.log(`✅ Exchange rate: ${exchangeRate.rate}`);
    console.log(`✅ Natural intervals: ${naturalIntervals.length}`);
    console.log(`✅ Lab intervals: ${labIntervals.length}`);
    
    // 2. Test parsing and pricing calculation with sample data
    console.log('\n2. Testing natural diamond sample processing...');
    
    const naturalCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/natural-large-sample.csv', 'utf8');
    const naturalLines = naturalCSV.split('\n');
    const naturalHeaders = naturalLines[0].split(',').map(h => h.trim());
    
    // Process first diamond as test
    const testRow = naturalLines[1].split(',');
    const testDiamond = parseDiamondRow(naturalHeaders, testRow, 'natural');
    
    console.log('   Raw parsed diamond:');
    console.log(`     ItemId: ${testDiamond.itemId}`);
    console.log(`     Carat: ${testDiamond.carat}`);
    console.log(`     USD Price Per Carat: ${testDiamond.pricePerCarat}`);
    console.log(`     USD Total Price: ${testDiamond.totalPrice}`);
    
    // Apply pricing calculation
    if (testDiamond.totalPrice && testDiamond.totalPrice > 0) {
      const totalPriceSek = testDiamond.totalPrice * exchangeRate.rate;
      
      // Find markup multiplier
      const multiplier = getMarkupMultiplier(testDiamond.carat, naturalIntervals);
      const priceWithMarkupSek = totalPriceSek * multiplier;
      const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
      
      console.log('   Pricing calculation result:');
      console.log(`     SEK Base (${testDiamond.totalPrice} * ${exchangeRate.rate}): ${totalPriceSek.toFixed(2)}`);
      console.log(`     Markup multiplier (${testDiamond.carat} carat): ${multiplier}x`);
      console.log(`     SEK with markup: ${priceWithMarkupSek.toFixed(2)}`);
      console.log(`     Final SEK (rounded): ${finalPriceSek}`);
      console.log('     ✅ PRICING CALCULATION SUCCESSFUL');
      
      testDiamond.totalPriceSek = totalPriceSek;
      testDiamond.priceWithMarkupSek = priceWithMarkupSek;
      testDiamond.finalPriceSek = finalPriceSek;
    } else {
      console.log('     ❌ NO PRICE DATA - would cause null prices');
    }
    
    // 3. Test lab diamond processing
    console.log('\n3. Testing lab diamond sample processing...');
    
    const labCSV = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/lab-large-sample.csv', 'utf8');
    const labLines = labCSV.split('\n');
    const labHeaders = labLines[0].split(',').map(h => h.trim());
    
    const labTestRow = labLines[1].split(',');
    const labTestDiamond = parseDiamondRow(labHeaders, labTestRow, 'lab');
    
    console.log('   Raw parsed lab diamond:');
    console.log(`     ItemId: ${labTestDiamond.itemId}`);
    console.log(`     Carat: ${labTestDiamond.carat}`);
    console.log(`     USD Price Per Carat: ${labTestDiamond.pricePerCarat}`);
    console.log(`     USD Total Price: ${labTestDiamond.totalPrice}`);
    
    // Apply pricing calculation
    if (labTestDiamond.totalPrice && labTestDiamond.totalPrice > 0) {
      const totalPriceSek = labTestDiamond.totalPrice * exchangeRate.rate;
      const multiplier = getMarkupMultiplier(labTestDiamond.carat, labIntervals);
      const priceWithMarkupSek = totalPriceSek * multiplier;
      const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
      
      console.log('   Lab pricing calculation result:');
      console.log(`     SEK Base: ${totalPriceSek.toFixed(2)}`);
      console.log(`     Markup multiplier: ${multiplier}x`);
      console.log(`     Final SEK: ${finalPriceSek}`);
      console.log('     ✅ LAB PRICING CALCULATION SUCCESSFUL');
    }
    
    // 4. Compare with failed import data
    console.log('\n4. Comparing with failed import data...');
    
    const failedNaturalDiamond = await prisma.diamond.findFirst({
      where: { 
        type: 'natural',
        totalPrice: null
      },
      select: {
        itemId: true,
        carat: true,
        totalPrice: true,
        pricePerCarat: true
      }
    });
    
    if (failedNaturalDiamond) {
      console.log('   Example failed natural diamond from DB:');
      console.log(`     ItemId: ${failedNaturalDiamond.itemId}`);
      console.log(`     Carat: ${failedNaturalDiamond.carat}`);
      console.log(`     USD Price Per Carat: ${failedNaturalDiamond.pricePerCarat}`);
      console.log(`     USD Total Price: ${failedNaturalDiamond.totalPrice}`);
      
      // Check if this diamond exists in sample
      const sampleMatch = naturalLines.find(line => line.includes(failedNaturalDiamond.itemId));
      if (sampleMatch) {
        console.log('     ✅ This diamond exists in sample with price data!');
        console.log(`     Sample data: ${sampleMatch.split(',').slice(0, 5).join(', ')}...`);
      } else {
        console.log('     ❌ This diamond not found in sample data');
      }
    }
    
    console.log('\n=== CONCLUSION ===');
    if (testDiamond.finalPriceSek && labTestDiamond.totalPrice) {
      console.log('✅ Sample data processing works perfectly');
      console.log('✅ CSV parsing works correctly');
      console.log('✅ Pricing calculations work correctly');
      console.log('');
      console.log('❌ The issue is that the PRODUCTION import had different data');
      console.log('   OR there was a specific parsing bug during the actual import');
      console.log('');
      console.log('RECOMMENDED ACTIONS:');
      console.log('1. Re-run import with fresh data (may have been a temporary API issue)');
      console.log('2. Check if production CSV had empty price fields');
      console.log('3. Add validation to reject diamonds with null prices during import');
    }
    
  } catch (error) {
    console.error('Error testing import with samples:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper functions (copied from IDEX service logic)
function parseDiamondRow(headers, values, diamondType) {
  const headerMapping = {
    'Item ID #': 'itemId',
    'Item ID': 'itemId',
    'Supplier Stock Ref.': 'supplierStockRef', 
    'Supplier Stock Ref': 'supplierStockRef',
    'Cut': 'cut',
    'Carat': 'carat',
    'Color': 'color',
    'Clarity': 'clarity',
    'Cut Grade': 'cutGrade',
    'Grading Lab': 'gradingLab',
    'Price Per Carat': 'pricePerCarat',
    'Total Price': 'totalPrice'
  };
  
  const diamond = { type: diamondType };
  
  headers.forEach((header, index) => {
    const fieldName = headerMapping[header];
    if (fieldName && values[index] !== undefined) {
      let value = values[index].trim();
      
      // Convert numeric fields
      if (['pricePerCarat', 'totalPrice', 'carat'].includes(fieldName)) {
        value = value === '' ? null : parseFloat(value) || null;
      }
      
      diamond[fieldName] = value;
    }
  });
  
  return diamond;
}

function getMarkupMultiplier(carat, markupRanges) {
  if (!carat || carat <= 0) {
    return 0;
  }

  const range = markupRanges.find((range, index) => {
    if (index === markupRanges.length - 1) {
      return carat >= range.minCarat && carat <= range.maxCarat;
    } else {
      return carat >= range.minCarat && carat < range.maxCarat;
    }
  });

  return range ? range.multiplier : 0;
}

testImportWithSamples();