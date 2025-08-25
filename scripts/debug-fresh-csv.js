import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Same headerToCamelCase function from IDEX service
function headerToCamelCase(header) {
  const map = {
    'Item ID #': 'itemId',
    'Supplier Stock Ref.': 'supplierStockRef',
    Cut: 'cut',
    Carat: 'carat',
    Color: 'color',
    'Natural Fancy Color': 'naturalFancyColor',
    'Natural Fancy Color Intensity': 'naturalFancyColorIntensity',
    'Natural Fancy Color Overtone': 'naturalFancyColorOvertone',
    'Treated Color': 'treatedColor',
    Clarity: 'clarity',
    'Cut Grade': 'cutGrade',
    'Grading Lab': 'gradingLab',
    'Certificate Number': 'certificateNumber',
    'Certificate Path': 'certificatePath',
    'Image Path': 'imagePath',
    'Online Report': 'onlineReport',
    'Video URL': 'videoUrl',
    '3DViewer URL': 'threeDViewerUrl',
    'Price Per Carat': 'pricePerCarat',
    'Total Price': 'totalPrice',
    '% Off IDEX List': 'percentOffIdexList',
    Polish: 'polish',
    Symmetry: 'symmetry',
    'Measurements Length': 'measurementsLength',
    'Measurements Width': 'measurementsWidth',
    'Measurements Height': 'measurementsHeight',
    'Measurements (LengthxWidthxHeight)': '_EMPTY_FIELD_',
    Depth: 'depthPercent',
    Table: 'tablePercent',
    'Crown Height': 'crownHeight',
    'Crown Angle': 'crownAngle',
    'Pavilion Depth': 'pavilionDepth',
    'Pavilion Angle': 'pavilionAngle',
    'Girdle From': 'girdleFrom',
    'Girdle To': 'girdleTo',
    'Girdle (From / To)': '_EMPTY_FIELD_',
    'Culet Size': 'culetSize',
    'Culet Condition': 'culetCondition',
    Graining: 'graining',
    'Fluorescence Intensity': 'fluorescenceIntensity',
    'Fluorescence Color': 'fluorescenceColor',
    Enhancement: 'enhancement',
    Country: 'country',
    'Country Code': 'countryCode',
    'Country Name': 'countryName',
    'State / Region': 'stateRegion',
    'State Code': 'stateCode',
    'State Name': 'stateName',
    'Pair Stock Ref.': 'pairStockRef',
    'Pair Stock Ref': 'pairStockRef',
    'Pair Separable': 'pairSeparable',
    'Asking Price For Pair': 'askingPriceForPair',
    'Asking Price Per Carat For Pair': 'askingPricePerCaratForPair',
    Shade: 'shade',
    Milky: 'milky',
    'Black Inclusion': 'blackInclusion',
    'Eye Clean': 'eyeClean',
    'Provenance Report': 'provenanceReport',
    'Provenance Number': 'provenanceNumber',
    Brand: 'brand',
    'Guaranteed Availability': 'guaranteedAvailability',
    Availability: 'availability',
    _EMPTY_FIELD_: '_EMPTY_FIELD_',
  };
  return (
    map[header] ||
    (header
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(' ')
      .map((word, index) =>
        index === 0
          ? word.toLowerCase()
          : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(''))
  );
}

async function debugFreshCsv() {
  console.log('=== DEBUGGING FRESH CSV PARSING ===\n');
  
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
    console.log('Natural intervals:', naturalIntervals.map(i => `${i.minCarat}-${i.maxCarat}: ${i.multiplier}x`));
    
    // Read fresh CSV
    const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/data-samples/Idex_Feed_2025_08_25_16_09_55.csv', 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    
    console.log(`\n=== CSV ANALYSIS ===`);
    console.log(`Total lines: ${lines.length}`);
    console.log(`Headers (${headers.length} total):`);
    
    // Find price columns
    const pricePerCaratIndex = headers.findIndex(h => h === 'Price Per Carat');
    const totalPriceIndex = headers.findIndex(h => h === 'Total Price');
    const caratIndex = headers.findIndex(h => h === 'Carat');
    const itemIdIndex = headers.findIndex(h => h === 'Item ID #');
    
    console.log(`  Price Per Carat column: ${pricePerCaratIndex} ("${headers[pricePerCaratIndex]}")`);
    console.log(`  Total Price column: ${totalPriceIndex} ("${headers[totalPriceIndex]}")`);
    console.log(`  Carat column: ${caratIndex} ("${headers[caratIndex]}")`);
    console.log(`  Item ID column: ${itemIdIndex} ("${headers[itemIdIndex]}")`);
    
    console.log(`\n=== PARSING TEST ===`);
    
    let successful = 0;
    let failed = 0;
    let priceSuccess = 0;
    
    // Test first 10 diamonds
    for (let i = 1; i <= Math.min(10, lines.length - 1); i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      
      console.log(`\n--- ROW ${i} ---`);
      console.log(`Raw line: "${line.substring(0, 150)}..."`);
      console.log(`Split into ${values.length} values`);
      
      if (values.length < Math.max(pricePerCaratIndex, totalPriceIndex, caratIndex, itemIdIndex)) {
        console.log(`❌ Insufficient columns (${values.length} < ${Math.max(pricePerCaratIndex, totalPriceIndex, caratIndex, itemIdIndex)})`);
        failed++;
        continue;
      }
      
      const itemId = values[itemIdIndex] || 'N/A';
      const carat = values[caratIndex] || 'N/A';
      const pricePerCarat = values[pricePerCaratIndex] || '';
      const totalPrice = values[totalPriceIndex] || '';
      
      console.log(`  ItemID: "${itemId}"`);
      console.log(`  Carat: "${carat}"`);
      console.log(`  Price Per Carat: "${pricePerCarat}"`);
      console.log(`  Total Price: "${totalPrice}"`);
      
      // Test parsing
      const parsedCarat = parseFloat(carat);
      const parsedPricePerCarat = parseFloat(pricePerCarat);
      const parsedTotalPrice = parseFloat(totalPrice);
      
      console.log(`  Parsed Carat: ${parsedCarat}`);
      console.log(`  Parsed Price Per Carat: ${parsedPricePerCarat}`);
      console.log(`  Parsed Total Price: ${parsedTotalPrice}`);
      
      if (itemId && !isNaN(parsedCarat) && !isNaN(parsedTotalPrice) && parsedTotalPrice > 0) {
        successful++;
        
        // Test price calculation
        const totalPriceSek = parsedTotalPrice * exchangeRate.rate;
        
        // Find markup multiplier (same logic as diamond-pricing service)
        const range = naturalIntervals.find((range, index) => {
          if (index === naturalIntervals.length - 1) {
            return parsedCarat >= range.minCarat && parsedCarat <= range.maxCarat;
          } else {
            return parsedCarat >= range.minCarat && parsedCarat < range.maxCarat;
          }
        });
        
        const multiplier = range ? range.multiplier : 1.0;
        const priceWithMarkupSek = totalPriceSek * multiplier;
        const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
        
        console.log(`  ✅ PRICING: $${parsedTotalPrice} → ${totalPriceSek.toFixed(2)} SEK → ${finalPriceSek} SEK (${multiplier}x)`);
        priceSuccess++;
      } else {
        console.log(`  ❌ MISSING DATA: itemId="${itemId}", carat=${parsedCarat}, totalPrice=${parsedTotalPrice}`);
        failed++;
      }
    }
    
    console.log(`\n=== RESULTS ===`);
    console.log(`Successful parses: ${successful}`);
    console.log(`Failed parses: ${failed}`);
    console.log(`With valid pricing: ${priceSuccess}`);
    console.log(`Success rate: ${((successful / (successful + failed)) * 100).toFixed(1)}%`);
    
    if (successful > 0) {
      console.log(`\n✅ CSV parsing works! The issue must be in the import pipeline.`);
    } else {
      console.log(`\n❌ CSV parsing is broken!`);
    }
    
  } catch (error) {
    console.error('Error debugging CSV:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugFreshCsv();