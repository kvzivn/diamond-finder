import fs from 'fs';
import { PrismaClient } from '@prisma/client';

// Same headerToCamelCase and parsing logic from IDEX service
function headerToCamelCase(header) {
  const map = {
    'Item ID #': 'itemId',
    'Item ID': 'itemId',
    'Supplier Stock Ref.': 'supplierStockRef',
    'Supplier Stock Ref': 'supplierStockRef',
    Cut: 'cut',
    Carat: 'carat',
    Color: 'color',
    'Natural Fancy Color': 'naturalFancyColor',
    'Natural Fancy Color Intensity': 'naturalFancyColorIntensity',
    'Natural Fancy Color Overtone': 'naturalFancyColorOvertone',
    'Treated Color': 'treatedColor',
    Clarity: 'clarity',
    'Cut Grade': 'cutGrade',
    'Make (Cut Grade)': 'cutGrade',
    'Grading Lab': 'gradingLab',
    'Certificate Number': 'certificateNumber',
    'Certificate Path': 'certificatePath',
    'Certificate URL': 'certificateUrl',
    'Image Path': 'imagePath',
    'Image URL': 'imagePath',
    'Online Report': 'onlineReport',
    'Online Report URL': 'onlineReportUrl',
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

function parseCSVLocal(csvString, headers) {
  const lines = csvString.trim().split('\n');
  // Skip the header row - IDEX CSV always includes headers as the first line
  const dataLines = lines.slice(1);
  
  const diamondKeys = headers.map(headerToCamelCase);

  return dataLines
    .map((line) => {
      const values = line.split(',');
      const diamond = {};

      headers.forEach((header, index) => {
        const key = diamondKeys[index];
        if (
          key === '_EMPTY_FIELD_' &&
          header !== 'Measurements (LengthxWidthxHeight)' &&
          header !== 'Girdle (From / To)'
        )
          return;

        const rawValue = values[index];
        if (rawValue !== undefined && rawValue.trim() !== '') {
          const value = rawValue.trim().replace(/"/g, '');

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
          } else if (key !== '_EMPTY_FIELD_') {
            // Basic type conversion - extend as needed
            if (
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
              diamond[key] =
                value.toLowerCase() === 'yes'
                  ? true
                  : value.toLowerCase() === 'no'
                    ? false
                    : value;
            } else {
              diamond[key] = value;
            }
          }
        }
      });
      return diamond;
    })
    .filter((d) => d.itemId); // Ensure a diamond has an itemId
}

async function testLocalCsvImport() {
  console.log('=== TESTING LOCAL CSV IMPORT SYSTEM ===\n');
  
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
    
    const labIntervals = await prisma.markupInterval.findMany({
      where: { type: 'lab' },
      orderBy: { minCarat: 'asc' }
    });
    
    if (!exchangeRate || naturalIntervals.length === 0 || labIntervals.length === 0) {
      console.log('❌ Missing pricing components');
      return;
    }
    
    console.log(`✅ Exchange rate: ${exchangeRate.rate}`);
    console.log(`✅ Natural intervals: ${naturalIntervals.length}`);
    console.log(`✅ Lab intervals: ${labIntervals.length}`);
    
    // Test both CSV files
    const testFiles = [
      {
        file: '/Users/bae/dev/diamond-finder/data-samples/Idex_Feed_2025_08_25_16_09_55.csv',
        type: 'natural',
        headers: [
          'Item ID #', 'Supplier Stock Ref.', 'Cut', 'Carat', 'Color', 'Natural Fancy Color',
          'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone', 'Treated Color',
          'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number', 'Certificate Path',
          'Image Path', 'Online Report', 'Video URL', '3DViewer URL', 'Price Per Carat',
          'Total Price', '% Off IDEX List', 'Polish', 'Symmetry', 'Measurements Length',
          'Measurements Width', 'Measurements Height', 'Depth', 'Table', 'Crown Height',
          'Crown Angle', 'Pavilion Depth', 'Pavilion Angle', 'Girdle From', 'Girdle To',
          'Culet Size', 'Culet Condition', 'Graining', 'Fluorescence Intensity',
          'Fluorescence Color', 'Enhancement', 'Country', 'State / Region',
          'Pair Stock Ref.', 'Asking Price For Pair', 'Shade', 'Milky', 'Black Inclusion',
          'Eye Clean', 'Provenance Report', 'Provenance Number', 'Brand', 'Guaranteed Availability'
        ],
        intervals: naturalIntervals
      },
      {
        file: '/Users/bae/dev/diamond-finder/data-samples/lab-full.csv',
        type: 'lab',
        headers: [
          'Item ID', 'Supplier Stock Ref', 'Cut', 'Carat', 'Color', 'Natural Fancy Color',
          'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone', 'Treated Color',
          'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number', 'Certificate URL',
          'Image URL', 'Online Report URL', 'Polish', 'Symmetry', 'Price Per Carat',
          'Total Price', 'Measurements Length', 'Measurements Width', 'Measurements Height',
          'Depth', 'Table', 'Crown Height', 'Crown Angle', 'Pavilion Depth',
          'Pavilion Angle', 'Girdle From', 'Girdle To', 'Culet Size', 'Culet Condition',
          'Graining', 'Fluorescence Intensity', 'Fluorescence Color', 'Enhancement',
          'Country Code', 'Country Name', 'State Code', 'State Name', 'Pair Stock Ref',
          'Pair Separable', 'Asking Price Per Carat For Pair', 'Shade', 'Milky',
          'Black Inclusion', 'Eye Clean', 'Provenance Report', 'Provenance Number',
          'Brand', 'Availability', 'Video URL', '3DViewer URL'
        ],
        intervals: labIntervals
      }
    ];
    
    // Clear existing diamonds
    console.log('\n1. Clearing existing diamonds...');
    const deletedNatural = await prisma.diamond.deleteMany({ where: { type: 'natural' } });
    const deletedLab = await prisma.diamond.deleteMany({ where: { type: 'lab' } });
    console.log(`Cleared ${deletedNatural.count} natural and ${deletedLab.count} lab diamonds`);
    
    let totalImported = 0;
    let totalWithPrices = 0;
    
    for (const testFile of testFiles) {
      console.log(`\n2. Testing ${testFile.type} diamonds: ${testFile.file}...`);
      
      if (!fs.existsSync(testFile.file)) {
        console.log(`❌ File not found: ${testFile.file}`);
        continue;
      }
      
      const csvContent = fs.readFileSync(testFile.file, 'utf8');
      const lines = csvContent.split('\n');
      
      console.log(`   Total lines: ${lines.length}`);
      console.log(`   Testing with first 100 diamonds...`);
      
      // Parse diamonds
      const diamonds = parseCSVLocal(csvContent, testFile.headers);
      const testDiamonds = diamonds.slice(0, 100); // Test with first 100
      
      console.log(`   Parsed ${testDiamonds.length} diamonds`);
      
      let imported = 0;
      let priceSuccess = 0;
      
      // Process each diamond
      for (const diamond of testDiamonds) {
        // Apply pricing if we have USD price
        if (diamond.totalPrice && diamond.carat) {
          const totalPriceSek = diamond.totalPrice * exchangeRate.rate;
          
          // Find markup multiplier
          const range = testFile.intervals.find((range, index) => {
            if (index === testFile.intervals.length - 1) {
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
          diamond.type = testFile.type;
          
          priceSuccess++;
        } else {
          diamond.type = testFile.type;
        }
        
        // Insert diamond
        try {
          await prisma.diamond.create({
            data: {
              itemId: `TEST-${testFile.type.toUpperCase()}-${diamond.itemId}`,
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
              type: testFile.type,
              certificatePath: diamond.certificatePath,
              certificateUrl: diamond.certificateUrl,
              imagePath: diamond.imagePath,
              videoUrl: diamond.videoUrl,
              threeDViewerUrl: diamond.threeDViewerUrl,
              enhancement: diamond.enhancement,
              country: diamond.country,
              countryCode: diamond.countryCode,
              countryName: diamond.countryName,
              stateRegion: diamond.stateRegion,
              stateCode: diamond.stateCode,
              stateName: diamond.stateName,
            }
          });
          imported++;
        } catch (error) {
          console.log(`   ⚠️  Failed to insert diamond ${diamond.itemId}: ${error.message}`);
        }
      }
      
      console.log(`   ✅ ${testFile.type.toUpperCase()} Results:`);
      console.log(`      Imported: ${imported}/${testDiamonds.length}`);
      console.log(`      With prices: ${priceSuccess}`);
      console.log(`      Success rate: ${((priceSuccess / imported) * 100).toFixed(1)}%`);
      
      totalImported += imported;
      totalWithPrices += priceSuccess;
    }
    
    console.log(`\n=== FINAL RESULTS ===`);
    console.log(`Total imported: ${totalImported}`);
    console.log(`Total with prices: ${totalWithPrices}`);
    console.log(`Overall success rate: ${((totalWithPrices / totalImported) * 100).toFixed(1)}%`);
    
    // Test API query
    console.log('\n3. Testing API query...');
    const apiTestCount = await prisma.diamond.count({
      where: {
        finalPriceSek: {
          gte: 1000,
          lte: 100000
        },
        carat: {
          gte: 0.3,
          lte: 5
        }
      }
    });
    
    console.log(`Diamonds matching API filters: ${apiTestCount}`);
    
    if (apiTestCount > 0) {
      console.log('🎉 Import system is working! API should now return diamonds.');
      console.log('\nTry this URL:');
      console.log('http://127.0.0.1:9293/apps/api/diamonds/all?limit=10&minPriceSek=1000&maxPriceSek=100000');
    } else {
      console.log('❌ Still no diamonds match API filters');
    }
    
  } catch (error) {
    console.error('Error testing local CSV import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLocalCsvImport();