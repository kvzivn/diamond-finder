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

async function importFreshSample() {
  console.log('=== IMPORTING FROM FRESH SAMPLE WITH PRICES ===\n');
  
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
    
    // Read fresh sample data  
    const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const diamondKeys = headers.map(headerToCamelCase);
    
    console.log(`\nProcessing ${lines.length - 1} sample diamonds...`);
    
    let imported = 0;
    let skipped = 0;
    let priceSuccess = 0;
    
    // Clear existing natural diamonds first
    console.log('Clearing existing natural diamonds...');
    await prisma.diamond.deleteMany({
      where: { type: 'natural' }
    });
    console.log('✅ Cleared existing natural diamonds\n');
    
    // Process first 20 diamonds from fresh sample
    for (let i = 1; i <= Math.min(20, lines.length - 1); i++) {
      const line = lines[i];
      const values = line.split(',');
      
      if (values.length < headers.length - 5) { // Allow some flexibility
        skipped++;
        continue;
      }
      
      const diamond = { type: 'natural' };
      
      // Parse diamond data using same logic as IDEX service
      headers.forEach((header, index) => {
        const key = diamondKeys[index];
        if (key === '_EMPTY_FIELD_' && header !== 'Measurements (LengthxWidthxHeight)' && header !== 'Girdle (From / To)') {
          return;
        }
        
        const rawValue = values[index];
        if (rawValue !== undefined && rawValue.trim() !== '') {
          const value = rawValue.trim();
          
          if (header === 'Measurements (LengthxWidthxHeight)') {
            const parts = value.split('x');
            if (parts.length === 3) {
              diamond.measurementsLength = parseFloat(parts[0]);
              diamond.measurementsWidth = parseFloat(parts[1]);
              diamond.measurementsHeight = parseFloat(parts[2]);
            }
          } else if (header === 'Girdle (From / To)') {
            const parts = value.split('/');
            if (parts.length === 2) {
              diamond.girdleFrom = parts[0].trim();
              diamond.girdleTo = parts[1].trim();
            }
          } else if (
            key === 'carat' ||
            key === 'pricePerCarat' ||
            key === 'totalPrice' ||
            key === 'percentOffIdexList' ||
            key === 'measurementsLength' ||
            key === 'measurementsWidth' ||
            key === 'measurementsHeight' ||
            key === 'depthPercent' ||
            key === 'tablePercent' ||
            key === 'crownHeight' ||
            key === 'crownAngle' ||
            key === 'pavilionDepth' ||
            key === 'pavilionAngle' ||
            key === 'askingPriceForPair' ||
            key === 'askingPricePerCaratForPair'
          ) {
            diamond[key] = parseFloat(value);
          } else if (key === 'pairSeparable') {
            diamond[key] = value.toLowerCase() === 'yes' ? true : value.toLowerCase() === 'no' ? false : value;
          } else {
            diamond[key] = value;
          }
        }
      });
      
      // Skip diamonds without essential data
      if (!diamond.itemId) {
        skipped++;
        continue;
      }
      
      console.log(`Processing ${diamond.itemId}: $${diamond.totalPrice}, ${diamond.carat} carat`);
      
      // Apply pricing calculations if we have USD price
      if (diamond.totalPrice && diamond.carat) {
        const totalPriceSek = diamond.totalPrice * exchangeRate.rate;
        
        // Find markup multiplier
        const range = naturalIntervals.find((range, index) => {
          if (index === naturalIntervals.length - 1) {
            return diamond.carat >= range.minCarat && diamond.carat <= range.maxCarat;
          } else {
            return diamond.carat >= range.minCarat && diamond.carat < range.maxCarat;
          }
        });
        
        const multiplier = range ? range.multiplier : 1.0;
        const priceWithMarkupSek = totalPriceSek * multiplier;
        const finalPriceSek = Math.round(priceWithMarkupSek / 100) * 100;
        
        diamond.totalPriceSek = totalPriceSek;
        diamond.priceWithMarkupSek = priceWithMarkupSek;
        diamond.finalPriceSek = finalPriceSek;
        
        console.log(`  → ${finalPriceSek} SEK (${multiplier}x markup)`);
        priceSuccess++;
      } else {
        console.log(`  → No pricing (missing USD price or carat)`);
      }
      
      // Insert diamond
      await prisma.diamond.create({
        data: {
          itemId: `FRESH-${diamond.itemId}`, // Prefix to avoid conflicts
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
          type: 'natural',
          // Add other fields that might be needed
          certificatePath: diamond.certificatePath,
          imagePath: diamond.imagePath,
          videoUrl: diamond.videoUrl,
          threeDViewerUrl: diamond.threeDViewerUrl,
          enhancement: diamond.enhancement,
          country: diamond.country,
          stateRegion: diamond.stateRegion,
        }
      });
      
      imported++;
    }
    
    console.log(`\n✅ Import complete:`);
    console.log(`  ${imported} diamonds imported`);
    console.log(`  ${priceSuccess} diamonds with prices`);
    console.log(`  ${skipped} skipped`);
    console.log(`  Success rate: ${((priceSuccess / imported) * 100).toFixed(1)}%`);
    
    // Test API call
    console.log('\n🧪 Testing API with fresh diamonds...');
    const testCount = await prisma.diamond.count({
      where: {
        type: 'natural',
        finalPriceSek: {
          gte: 1000,
          lte: 100000
        }
      }
    });
    
    console.log(`Diamonds in 1000-100000 SEK range: ${testCount}`);
    console.log('\nTry this URL:');
    console.log('http://127.0.0.1:9293/apps/api/diamonds/all?type=natural&limit=10&minPriceSek=1000&maxPriceSek=100000');
    
  } catch (error) {
    console.error('Error importing fresh sample:', error);
  } finally {
    await prisma.$disconnect();
  }
}

importFreshSample();