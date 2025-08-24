#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { DiamondType } from '../app/models/diamond.server.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV Headers from idex.service.server.ts
const NATURAL_DIAMOND_HEADERS = [
  'Item ID #',
  'Supplier Stock Ref.',
  'Cut',
  'Carat',
  'Color',
  'Natural Fancy Color',
  'Natural Fancy Color Intensity',
  'Natural Fancy Color Overtone',
  'Treated Color',
  'Clarity',
  'Cut Grade',
  'Grading Lab',
  'Certificate Number',
  'Certificate Path',
  'Image Path',
  'Online Report',
  'Video URL',
  '3DViewer URL',
  'Price Per Carat',
  'Total Price',
  '% Off IDEX List',
  'Polish',
  'Symmetry',
  'Measurements Length',
  'Measurements Width',
  'Measurements Height',
  'Depth',
  'Table',
  'Crown Height',
  'Crown Angle',
  'Pavilion Depth',
  'Pavilion Angle',
  'Girdle From',
  'Girdle To',
  'Culet Size',
  'Culet Condition',
  'Graining',
  'Fluorescence Intensity',
  'Fluorescence Color',
  'Enhancement',
  'Country',
  'State / Region',
  'Pair Stock Ref.',
  'Asking Price For Pair',
  'Shade',
  'Milky',
  'Black Inclusion',
  'Eye Clean',
  'Provenance Report',
  'Provenance Number',
  'Brand',
  'Guaranteed Availability',
];

const LAB_GROWN_DIAMOND_HEADERS = [
  'Item ID',
  'Supplier Stock Ref',
  'Cut',
  'Carat',
  'Color',
  'Natural Fancy Color',
  'Natural Fancy Color Intensity',
  'Natural Fancy Color Overtone',
  'Treated Color',
  'Clarity',
  'Cut Grade',
  'Grading Lab',
  'Certificate Number',
  'Certificate URL',
  'Image URL',
  'Online Report URL',
  'Polish',
  'Symmetry',
  'Price Per Carat',
  'Total Price',
  'Measurements Length',
  'Measurements Width',
  'Measurements Height',
  'Depth',
  'Table',
  'Crown Height',
  'Crown Angle',
  'Pavilion Depth',
  'Pavilion Angle',
  'Girdle From',
  'Girdle To',
  'Culet Size',
  'Culet Condition',
  'Graining',
  'Fluorescence Intensity',
  'Fluorescence Color',
  'Enhancement',
  'Country Code',
  'Country Name',
  'State Code',
  'State Name',
  'Pair Stock Ref',
  'Pair Separable',
  'Asking Price Per Carat For Pair',
  'Shade',
  'Milky',
  'Black Inclusion',
  'Eye Clean',
  'Provenance Report',
  'Provenance Number',
  'Brand',
  'Availability',
  'Video URL',
  '3DViewer URL',
];

// Header to field mapping from idex.service.server.ts
function headerToCamelCase(header: string): string {
  const map: Record<string, string> = {
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
    header
      .toLowerCase()
      .replace(/\s+\(?\w*\)?/g, '')
      .replace(/\W/g, '')
  );
}

// Simulated exchange rate (normally fetched from API)
const MOCK_USD_TO_SEK_RATE = 10.5; // Example rate

// Parse CSV function from idex.service.server.ts
function parseCSV(
  csvString: string,
  headers: string[],
  type: DiamondType
): any[] {
  const lines = csvString.trim().split('\n');

  // Skip header row if present
  let dataLines = lines;
  if (lines[0].includes('Item ID') || lines[0].startsWith('\ufeff')) {
    dataLines = lines.slice(1);
    console.log(`  Skipped header row for ${type} diamonds`);
  }

  const diamondKeys = headers.map(headerToCamelCase);

  return dataLines
    .map((line, lineIndex) => {
      const values = line.split(',');
      const diamond: any = {};

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
          } else if (key !== '_EMPTY_FIELD_') {
            // Type conversion matching idex.service.server.ts
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

// Process diamonds like production (matching idex.service.server.ts and import-diamonds-direct.ts)
function processDiamonds(
  diamonds: any[],
  type: DiamondType,
  importJobId: string
): any[] {
  let labGrownInNaturalCount: number;

  return diamonds.map((diamond) => {
    // Check for lab-grown diamonds in natural endpoint based on certificate number
    const isLabGrownInNatural =
      type === 'natural' &&
      diamond.certificateNumber &&
      diamond.certificateNumber.toUpperCase().includes('LG');

    if (isLabGrownInNatural) {
      labGrownInNaturalCount = labGrownInNaturalCount + 1;
    }

    // Apply exchange rate conversion (matching idex.service.server.ts)
    let totalPriceSek = null;
    if (typeof diamond.totalPrice === 'number') {
      // Convert USD to SEK without markup (markup would be applied on client side)
      totalPriceSek = diamond.totalPrice * MOCK_USD_TO_SEK_RATE;
    }

    // Store original CSV values for validation
    const originalCSVPrice = diamond.totalPrice;
    const originalPricePerCarat = diamond.pricePerCarat;

    // Create the database record structure (matching import-diamonds-direct.ts)
    const dbRecord = {
      id: randomUUID(),
      itemId: diamond.itemId,
      supplierStockRef: diamond.supplierStockRef,
      cut: diamond.cut,
      carat: diamond.carat,
      color: diamond.color,
      naturalFancyColor: diamond.naturalFancyColor,
      naturalFancyColorIntensity: diamond.naturalFancyColorIntensity,
      naturalFancyColorOvertone: diamond.naturalFancyColorOvertone,
      treatedColor: diamond.treatedColor,
      clarity: diamond.clarity,
      cutGrade: diamond.cutGrade,
      gradingLab: diamond.gradingLab,
      certificateNumber: diamond.certificateNumber,
      certificatePath: diamond.certificatePath,
      certificateUrl: diamond.certificateUrl,
      imagePath: diamond.imagePath,
      imageUrl: diamond.imageUrl,
      onlineReport: diamond.onlineReport,
      onlineReportUrl: diamond.onlineReportUrl,
      videoUrl: diamond.videoUrl,
      threeDViewerUrl: diamond.threeDViewerUrl,
      pricePerCarat: diamond.pricePerCarat,
      totalPrice: diamond.totalPrice,
      totalPriceSek: totalPriceSek,
      percentOffIdexList: diamond.percentOffIdexList,
      polish: diamond.polish,
      symmetry: diamond.symmetry,
      measurementsLength: diamond.measurementsLength,
      measurementsWidth: diamond.measurementsWidth,
      measurementsHeight: diamond.measurementsHeight,
      depthPercent: diamond.depthPercent,
      tablePercent: diamond.tablePercent,
      crownHeight: diamond.crownHeight,
      crownAngle: diamond.crownAngle,
      pavilionDepth: diamond.pavilionDepth,
      pavilionAngle: diamond.pavilionAngle,
      girdleFrom: diamond.girdleFrom,
      girdleTo: diamond.girdleTo,
      culetSize: diamond.culetSize,
      culetCondition: diamond.culetCondition,
      graining: diamond.graining,
      fluorescenceIntensity: diamond.fluorescenceIntensity,
      fluorescenceColor: diamond.fluorescenceColor,
      enhancement: diamond.enhancement,
      country: diamond.country,
      countryCode: diamond.countryCode,
      countryName: diamond.countryName,
      stateRegion: diamond.stateRegion,
      stateCode: diamond.stateCode,
      stateName: diamond.stateName,
      pairStockRef: diamond.pairStockRef,
      pairSeparable: diamond.pairSeparable,
      askingPriceForPair: diamond.askingPriceForPair,
      askingPricePerCaratForPair: diamond.askingPricePerCaratForPair,
      shade: diamond.shade,
      milky: diamond.milky,
      blackInclusion: diamond.blackInclusion,
      eyeClean: diamond.eyeClean,
      provenanceReport: diamond.provenanceReport,
      provenanceNumber: diamond.provenanceNumber,
      brand: diamond.brand,
      guaranteedAvailability: diamond.guaranteedAvailability,
      availability: diamond.availability,
      // Type is adjusted if it's a lab-grown diamond in natural endpoint
      type: isLabGrownInNatural ? 'lab' : type,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      importJobId: importJobId,
      // Add metadata for debugging
      _metadata: {
        originalType: type,
        wasTypeChanged: isLabGrownInNatural,
        hasUSDPrice: typeof diamond.totalPrice === 'number',
        hasSEKPrice: totalPriceSek !== null,
        exchangeRateUsed: MOCK_USD_TO_SEK_RATE,
        originalCSVPrice: originalCSVPrice,
        originalPricePerCarat: originalPricePerCarat,
        priceMatches: originalCSVPrice === diamond.totalPrice,
      },
    };

    return dbRecord;
  });
}

async function importSamples() {
  console.log('=== DIAMOND SAMPLE IMPORT TEST ===\n');
  console.log('This script simulates the production import process');
  console.log(
    `Using mock exchange rate: 1 USD = ${MOCK_USD_TO_SEK_RATE} SEK\n`
  );

  const results: any = {
    natural: {
      totalCount: 0,
      withUSDPrice: 0,
      withSEKPrice: 0,
      withoutPrice: 0,
      typeChanged: 0,
      priceStats: {
        minUSD: Infinity,
        maxUSD: -Infinity,
        avgUSD: 0,
        minSEK: Infinity,
        maxSEK: -Infinity,
        avgSEK: 0,
      },
      samples: [],
      allRecords: [],
    },
    lab: {
      totalCount: 0,
      withUSDPrice: 0,
      withSEKPrice: 0,
      withoutPrice: 0,
      priceStats: {
        minUSD: Infinity,
        maxUSD: -Infinity,
        avgUSD: 0,
        minSEK: Infinity,
        maxSEK: -Infinity,
        avgSEK: 0,
      },
      samples: [],
      allRecords: [],
    },
  };

  // Process natural diamonds
  console.log('Processing natural diamonds...');
  const naturalFullPath = path.join(
    __dirname,
    '..',
    'data-samples',
    'natural-full.csv'
  );
  const naturalLargePath = path.join(
    __dirname,
    '..',
    'data-samples',
    'natural-large-sample.csv'
  );

  // Check for full file first, then large sample, then regular sample
  let naturalCsv: string;
  if (fs.existsSync(naturalFullPath)) {
    naturalCsv = fs.readFileSync(naturalFullPath, 'utf-8');
    console.log(`  Reading from: natural-full.csv (FULL DATASET)`);
  } else if (fs.existsSync(naturalLargePath)) {
    naturalCsv = fs.readFileSync(naturalLargePath, 'utf-8');
    console.log(`  Reading from: natural-large-sample.csv`);
  } else {
    const fallbackPath = path.join(
      __dirname,
      '..',
      'data-samples',
      'natural.csv'
    );
    naturalCsv = fs.readFileSync(fallbackPath, 'utf-8');
    console.log(`  Reading from: natural.csv (large sample not found)`);
  }

  const naturalImportJobId = randomUUID();
  const naturalDiamonds = parseCSV(
    naturalCsv,
    NATURAL_DIAMOND_HEADERS,
    'natural'
  );
  const naturalDbRecords = processDiamonds(
    naturalDiamonds,
    'natural',
    naturalImportJobId
  );

  results.natural.totalCount = naturalDbRecords.length;
  results.natural.allRecords = naturalDbRecords;

  let totalUSDSum = 0;
  let totalSEKSum = 0;

  naturalDbRecords.forEach((record, index) => {
    // Count price availability
    if (typeof record.totalPrice === 'number' && !isNaN(record.totalPrice)) {
      results.natural.withUSDPrice++;
      totalUSDSum += record.totalPrice;

      if (record.totalPrice < results.natural.priceStats.minUSD) {
        results.natural.priceStats.minUSD = record.totalPrice;
      }
      if (record.totalPrice > results.natural.priceStats.maxUSD) {
        results.natural.priceStats.maxUSD = record.totalPrice;
      }
    } else {
      results.natural.withoutPrice++;
    }

    if (
      typeof record.totalPriceSek === 'number' &&
      !isNaN(record.totalPriceSek)
    ) {
      results.natural.withSEKPrice++;
      totalSEKSum += record.totalPriceSek;

      if (record.totalPriceSek < results.natural.priceStats.minSEK) {
        results.natural.priceStats.minSEK = record.totalPriceSek;
      }
      if (record.totalPriceSek > results.natural.priceStats.maxSEK) {
        results.natural.priceStats.maxSEK = record.totalPriceSek;
      }
    }

    // Count type changes
    if (record._metadata.wasTypeChanged) {
      results.natural.typeChanged++;
    }

    // Store first 5 samples
    if (index < 5) {
      results.natural.samples.push(record);
    }
  });

  if (results.natural.withUSDPrice > 0) {
    results.natural.priceStats.avgUSD =
      totalUSDSum / results.natural.withUSDPrice;
  }
  if (results.natural.withSEKPrice > 0) {
    results.natural.priceStats.avgSEK =
      totalSEKSum / results.natural.withSEKPrice;
  }

  // Process lab-grown diamonds
  console.log('Processing lab-grown diamonds...');
  const labFullPath = path.join(
    __dirname,
    '..',
    'data-samples',
    'lab-full.csv'
  );
  const labLargePath = path.join(
    __dirname,
    '..',
    'data-samples',
    'lab-large-sample.csv'
  );

  // Check for full file first, then large sample, then regular sample
  let labCsv: string;
  if (fs.existsSync(labFullPath)) {
    labCsv = fs.readFileSync(labFullPath, 'utf-8');
    console.log(`  Reading from: lab-full.csv (FULL DATASET)`);
  } else if (fs.existsSync(labLargePath)) {
    labCsv = fs.readFileSync(labLargePath, 'utf-8');
    console.log(`  Reading from: lab-large-sample.csv`);
  } else {
    const fallbackPath = path.join(__dirname, '..', 'data-samples', 'lab.csv');
    labCsv = fs.readFileSync(fallbackPath, 'utf-8');
    console.log(`  Reading from: lab.csv (large sample not found)`);
  }

  const labImportJobId = randomUUID();
  const labDiamonds = parseCSV(labCsv, LAB_GROWN_DIAMOND_HEADERS, 'lab');
  const labDbRecords = processDiamonds(labDiamonds, 'lab', labImportJobId);

  results.lab.totalCount = labDbRecords.length;
  results.lab.allRecords = labDbRecords;

  totalUSDSum = 0;
  totalSEKSum = 0;

  labDbRecords.forEach((record, index) => {
    // Count price availability
    if (typeof record.totalPrice === 'number' && !isNaN(record.totalPrice)) {
      results.lab.withUSDPrice++;
      totalUSDSum += record.totalPrice;

      if (record.totalPrice < results.lab.priceStats.minUSD) {
        results.lab.priceStats.minUSD = record.totalPrice;
      }
      if (record.totalPrice > results.lab.priceStats.maxUSD) {
        results.lab.priceStats.maxUSD = record.totalPrice;
      }
    } else {
      results.lab.withoutPrice++;
    }

    if (
      typeof record.totalPriceSek === 'number' &&
      !isNaN(record.totalPriceSek)
    ) {
      results.lab.withSEKPrice++;
      totalSEKSum += record.totalPriceSek;

      if (record.totalPriceSek < results.lab.priceStats.minSEK) {
        results.lab.priceStats.minSEK = record.totalPriceSek;
      }
      if (record.totalPriceSek > results.lab.priceStats.maxSEK) {
        results.lab.priceStats.maxSEK = record.totalPriceSek;
      }
    }

    // Store first 5 samples
    if (index < 5) {
      results.lab.samples.push(record);
    }
  });

  if (results.lab.withUSDPrice > 0) {
    results.lab.priceStats.avgUSD = totalUSDSum / results.lab.withUSDPrice;
  }
  if (results.lab.withSEKPrice > 0) {
    results.lab.priceStats.avgSEK = totalSEKSum / results.lab.withSEKPrice;
  }

  // Write detailed results to data-samples folder
  const outputPath = path.join(
    __dirname,
    '..',
    'data-samples',
    'sample-import-results.json'
  );
  const summaryOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      exchangeRateUsed: MOCK_USD_TO_SEK_RATE,
      naturalImportJobId,
      labImportJobId,
    },
    natural: {
      ...results.natural,
      allRecords: undefined, // Remove full records from summary
    },
    lab: {
      ...results.lab,
      allRecords: undefined, // Remove full records from summary
    },
  };

  fs.writeFileSync(outputPath, JSON.stringify(summaryOutput, null, 2));

  // Write full database records to separate file in data-samples folder
  const dbRecordsPath = path.join(
    __dirname,
    '..',
    'data-samples',
    'sample-import-db-records.json'
  );
  fs.writeFileSync(
    dbRecordsPath,
    JSON.stringify(
      {
        natural: results.natural.allRecords,
        lab: results.lab.allRecords,
      },
      null,
      2
    )
  );

  // Print summary
  console.log('\n=== IMPORT RESULTS SUMMARY ===\n');

  console.log('NATURAL DIAMONDS:');
  console.log(`  Total processed: ${results.natural.totalCount}`);
  console.log(`  With USD price: ${results.natural.withUSDPrice}`);
  console.log(`  With SEK price: ${results.natural.withSEKPrice}`);
  console.log(`  Without price: ${results.natural.withoutPrice}`);
  console.log(`  Type changed (LG cert): ${results.natural.typeChanged}`);
  if (results.natural.withUSDPrice > 0) {
    console.log(
      `  USD price range: $${results.natural.priceStats.minUSD.toFixed(2)} - $${results.natural.priceStats.maxUSD.toFixed(2)}`
    );
    console.log(
      `  USD average: $${results.natural.priceStats.avgUSD.toFixed(2)}`
    );
  }
  if (results.natural.withSEKPrice > 0) {
    console.log(
      `  SEK price range: ${results.natural.priceStats.minSEK.toFixed(2)} - ${results.natural.priceStats.maxSEK.toFixed(2)} SEK`
    );
    console.log(
      `  SEK average: ${results.natural.priceStats.avgSEK.toFixed(2)} SEK`
    );
  }

  console.log('\nLAB-GROWN DIAMONDS:');
  console.log(`  Total processed: ${results.lab.totalCount}`);
  console.log(`  With USD price: ${results.lab.withUSDPrice}`);
  console.log(`  With SEK price: ${results.lab.withSEKPrice}`);
  console.log(`  Without price: ${results.lab.withoutPrice}`);
  if (results.lab.withUSDPrice > 0) {
    console.log(
      `  USD price range: $${results.lab.priceStats.minUSD.toFixed(2)} - $${results.lab.priceStats.maxUSD.toFixed(2)}`
    );
    console.log(`  USD average: $${results.lab.priceStats.avgUSD.toFixed(2)}`);
  }
  if (results.lab.withSEKPrice > 0) {
    console.log(
      `  SEK price range: ${results.lab.priceStats.minSEK.toFixed(2)} - ${results.lab.priceStats.maxSEK.toFixed(2)} SEK`
    );
    console.log(
      `  SEK average: ${results.lab.priceStats.avgSEK.toFixed(2)} SEK`
    );
  }

  console.log(`\nSummary written to: ${outputPath}`);
  console.log(`Database records written to: ${dbRecordsPath}`);

  // Validate pricing
  console.log('\n=== PRICE VALIDATION ===\n');

  let priceDiscrepancies = 0;
  let sekConversionErrors = 0;
  let csvToJsonMismatches = 0;

  // Check all records for CSV to JSON price matching
  console.log('Checking CSV to JSON price integrity...');
  [...results.natural.allRecords, ...results.lab.allRecords].forEach(
    (record: any) => {
      if (!record._metadata.priceMatches) {
        csvToJsonMismatches++;
        console.log(
          `  ⚠️ Price mismatch for ${record.itemId}: CSV=${record._metadata.originalCSVPrice}, JSON=${record.totalPrice}`
        );
      }
    }
  );

  if (csvToJsonMismatches === 0) {
    console.log('✅ All CSV prices match JSON output prices perfectly');
  } else {
    console.log(`⚠️ Found ${csvToJsonMismatches} CSV to JSON price mismatches`);
  }

  console.log('\nChecking price calculations...');
  // Check first 10 records of each type for detailed validation
  const naturalSample = results.natural.allRecords.slice(0, 10);
  const labSample = results.lab.allRecords.slice(0, 10);

  [...naturalSample, ...labSample].forEach((record: any) => {
    // Check if totalPrice matches carat * pricePerCarat
    if (record.carat && record.pricePerCarat && record.totalPrice) {
      const calculated = record.carat * record.pricePerCarat;
      const diff = Math.abs(record.totalPrice - calculated);
      if (diff > 0.01) {
        priceDiscrepancies++;
        console.log(
          `  Price calc error ${record.itemId}: totalPrice=${record.totalPrice}, calculated=${calculated.toFixed(2)}, diff=${diff.toFixed(4)}`
        );
      }
    }

    // Check SEK conversion
    if (record.totalPrice && record.totalPriceSek) {
      const expectedSek = record.totalPrice * MOCK_USD_TO_SEK_RATE;
      const diff = Math.abs(record.totalPriceSek - expectedSek);
      if (diff > 0.01) {
        sekConversionErrors++;
        console.log(
          `  SEK conversion error ${record.itemId}: expected=${expectedSek.toFixed(2)}, actual=${record.totalPriceSek}`
        );
      }
    }
  });

  if (priceDiscrepancies === 0 && sekConversionErrors === 0) {
    console.log('✅ All price calculations and SEK conversions are correct');
  } else {
    if (priceDiscrepancies > 0) {
      console.log(
        `⚠️ Found ${priceDiscrepancies} price calculation discrepancies`
      );
    }
    if (sekConversionErrors > 0) {
      console.log(`⚠️ Found ${sekConversionErrors} SEK conversion errors`);
    }
  }

  // Show sample of price data for verification
  console.log('\n=== SAMPLE PRICE DATA (first 3 of each type) ===\n');
  console.log('Natural Diamonds:');
  results.natural.allRecords.slice(0, 3).forEach((record: any) => {
    console.log(
      `  ${record.itemId}: CSV Price=$${record._metadata.originalCSVPrice}, DB Price=$${record.totalPrice}, SEK=${record.totalPriceSek?.toFixed(2) || 'N/A'}`
    );
  });

  console.log('\nLab-Grown Diamonds:');
  results.lab.allRecords.slice(0, 3).forEach((record: any) => {
    console.log(
      `  ${record.itemId}: CSV Price=$${record._metadata.originalCSVPrice}, DB Price=$${record.totalPrice}, SEK=${record.totalPriceSek?.toFixed(2) || 'N/A'}`
    );
  });

  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the import
importSamples().catch(console.error);
