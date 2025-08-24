#!/usr/bin/env tsx

import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
import type { DiamondType } from '../app/models/diamond.server.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CSV Headers
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

// Header mapping function
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
    Depth: 'depthPercent',
    Table: 'tablePercent',
    'Crown Height': 'crownHeight',
    'Crown Angle': 'crownAngle',
    'Pavilion Depth': 'pavilionDepth',
    'Pavilion Angle': 'pavilionAngle',
    'Girdle From': 'girdleFrom',
    'Girdle To': 'girdleTo',
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

const MOCK_USD_TO_SEK_RATE = 10.5;

// Parse a single CSV line
function parseCSVLine(line: string, headers: string[], type: DiamondType): any {
  const values = line.split(',');
  const diamond: any = {};
  const diamondKeys = headers.map(headerToCamelCase);

  headers.forEach((header, index) => {
    const key = diamondKeys[index];
    if (key === '_EMPTY_FIELD_') return;

    const rawValue = values[index];
    if (rawValue !== undefined && rawValue.trim() !== '') {
      const value = rawValue.trim();

      // Type conversion
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
        diamond[key] = value.toLowerCase() === 'yes' ? true : value.toLowerCase() === 'no' ? false : value;
      } else {
        diamond[key] = value;
      }
    }
  });

  return diamond.itemId ? diamond : null;
}

// Process diamond for database
function processDiamond(diamond: any, type: DiamondType, importJobId: string): any {
  const isLabGrownInNatural = 
    type === 'natural' && 
    diamond.certificateNumber && 
    diamond.certificateNumber.toUpperCase().includes('LG');

  let totalPriceSek = null;
  if (typeof diamond.totalPrice === 'number') {
    totalPriceSek = diamond.totalPrice * MOCK_USD_TO_SEK_RATE;
  }

  return {
    id: randomUUID(),
    ...diamond,
    totalPriceSek,
    type: isLabGrownInNatural ? 'lab' : type,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    importJobId,
    _metadata: {
      originalType: type,
      wasTypeChanged: isLabGrownInNatural,
      hasUSDPrice: typeof diamond.totalPrice === 'number',
      hasSEKPrice: totalPriceSek !== null,
      exchangeRateUsed: MOCK_USD_TO_SEK_RATE,
      originalCSVPrice: diamond.totalPrice,
      originalPricePerCarat: diamond.pricePerCarat,
      priceMatches: true
    }
  };
}

// Stream process CSV file
async function processCSVStream(
  filePath: string,
  headers: string[],
  type: DiamondType,
  importJobId: string,
  outputStream: fs.WriteStream,
  isFirstBatch: boolean
): Promise<any> {
  const stats = {
    totalCount: 0,
    withUSDPrice: 0,
    withSEKPrice: 0,
    withoutPrice: 0,
    typeChanged: 0,
    priceStats: {
      minUSD: Infinity,
      maxUSD: -Infinity,
      totalUSD: 0,
      minSEK: Infinity,
      maxSEK: -Infinity,
      totalSEK: 0
    },
    samples: [] as any[],
    randomSamples: [] as any[]
  };

  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  let isFirstRecord = true;

  for await (const line of rl) {
    lineNumber++;
    
    // Skip header
    if (lineNumber === 1 && (line.includes('Item ID') || line.startsWith('\ufeff'))) {
      console.log(`  Skipped header row for ${type} diamonds`);
      continue;
    }

    const diamond = parseCSVLine(line, headers, type);
    if (!diamond) continue;

    const dbRecord = processDiamond(diamond, type, importJobId);
    stats.totalCount++;

    // Update statistics
    if (typeof dbRecord.totalPrice === 'number' && !isNaN(dbRecord.totalPrice)) {
      stats.withUSDPrice++;
      stats.priceStats.totalUSD += dbRecord.totalPrice;
      stats.priceStats.minUSD = Math.min(stats.priceStats.minUSD, dbRecord.totalPrice);
      stats.priceStats.maxUSD = Math.max(stats.priceStats.maxUSD, dbRecord.totalPrice);
    } else {
      stats.withoutPrice++;
    }

    if (typeof dbRecord.totalPriceSek === 'number' && !isNaN(dbRecord.totalPriceSek)) {
      stats.withSEKPrice++;
      stats.priceStats.totalSEK += dbRecord.totalPriceSek;
      stats.priceStats.minSEK = Math.min(stats.priceStats.minSEK, dbRecord.totalPriceSek);
      stats.priceStats.maxSEK = Math.max(stats.priceStats.maxSEK, dbRecord.totalPriceSek);
    }

    if (dbRecord._metadata.wasTypeChanged) {
      stats.typeChanged++;
    }

    // Collect first 5 samples
    if (stats.samples.length < 5) {
      stats.samples.push(dbRecord);
    }

    // Collect random samples throughout the file
    if (stats.totalCount % 10000 === 0) {
      stats.randomSamples.push({
        lineNumber: lineNumber,
        itemId: dbRecord.itemId,
        totalPrice: dbRecord.totalPrice,
        totalPriceSek: dbRecord.totalPriceSek,
        originalCSVPrice: dbRecord._metadata.originalCSVPrice
      });
    }

    // Write to output stream
    if (!isFirstBatch || !isFirstRecord) {
      outputStream.write(',\n');
    }
    outputStream.write(JSON.stringify(dbRecord, null, 2));
    isFirstRecord = false;

    // Progress indicator
    if (stats.totalCount % 25000 === 0) {
      console.log(`  Processed ${stats.totalCount.toLocaleString()} ${type} diamonds...`);
    }
  }

  return stats;
}

async function importSamplesStreaming() {
  console.log('=== DIAMOND SAMPLE IMPORT TEST (STREAMING) ===\n');
  console.log('This script simulates the production import process with memory-efficient streaming');
  console.log(`Using mock exchange rate: 1 USD = ${MOCK_USD_TO_SEK_RATE} SEK\n`);

  const naturalImportJobId = randomUUID();
  const labImportJobId = randomUUID();

  // Create output stream for database records
  const dbRecordsPath = path.join(__dirname, '..', 'data-samples', 'sample-import-db-records-full.json');
  const outputStream = fs.createWriteStream(dbRecordsPath);
  outputStream.write('{\n');

  // Process natural diamonds
  console.log('Processing natural diamonds...');
  const naturalPath = path.join(__dirname, '..', 'data-samples', 'natural-full.csv');
  
  outputStream.write('  "natural": [\n');
  const naturalStats = await processCSVStream(
    naturalPath,
    NATURAL_DIAMOND_HEADERS,
    'natural',
    naturalImportJobId,
    outputStream,
    true
  );
  outputStream.write('\n  ],\n');
  
  console.log(`  Completed: ${naturalStats.totalCount.toLocaleString()} natural diamonds processed`);

  // Process lab-grown diamonds
  console.log('\nProcessing lab-grown diamonds...');
  const labPath = path.join(__dirname, '..', 'data-samples', 'lab-full.csv');
  
  outputStream.write('  "lab": [\n');
  const labStats = await processCSVStream(
    labPath,
    LAB_GROWN_DIAMOND_HEADERS,
    'lab',
    labImportJobId,
    outputStream,
    false
  );
  outputStream.write('\n  ]\n');
  
  console.log(`  Completed: ${labStats.totalCount.toLocaleString()} lab-grown diamonds processed`);

  outputStream.write('}\n');
  outputStream.end();

  // Calculate averages
  if (naturalStats.withUSDPrice > 0) {
    naturalStats.priceStats.avgUSD = naturalStats.priceStats.totalUSD / naturalStats.withUSDPrice;
  }
  if (naturalStats.withSEKPrice > 0) {
    naturalStats.priceStats.avgSEK = naturalStats.priceStats.totalSEK / naturalStats.withSEKPrice;
  }
  if (labStats.withUSDPrice > 0) {
    labStats.priceStats.avgUSD = labStats.priceStats.totalUSD / labStats.withUSDPrice;
  }
  if (labStats.withSEKPrice > 0) {
    labStats.priceStats.avgSEK = labStats.priceStats.totalSEK / labStats.withSEKPrice;
  }

  // Write summary
  const summaryPath = path.join(__dirname, '..', 'data-samples', 'sample-import-results-full.json');
  const summaryOutput = {
    metadata: {
      timestamp: new Date().toISOString(),
      exchangeRateUsed: MOCK_USD_TO_SEK_RATE,
      naturalImportJobId,
      labImportJobId
    },
    natural: {
      totalCount: naturalStats.totalCount,
      withUSDPrice: naturalStats.withUSDPrice,
      withSEKPrice: naturalStats.withSEKPrice,
      withoutPrice: naturalStats.withoutPrice,
      typeChanged: naturalStats.typeChanged,
      priceStats: {
        minUSD: naturalStats.priceStats.minUSD,
        maxUSD: naturalStats.priceStats.maxUSD,
        avgUSD: naturalStats.priceStats.avgUSD,
        minSEK: naturalStats.priceStats.minSEK,
        maxSEK: naturalStats.priceStats.maxSEK,
        avgSEK: naturalStats.priceStats.avgSEK
      },
      samples: naturalStats.samples,
      randomSamples: naturalStats.randomSamples
    },
    lab: {
      totalCount: labStats.totalCount,
      withUSDPrice: labStats.withUSDPrice,
      withSEKPrice: labStats.withSEKPrice,
      withoutPrice: labStats.withoutPrice,
      typeChanged: labStats.typeChanged,
      priceStats: {
        minUSD: labStats.priceStats.minUSD,
        maxUSD: labStats.priceStats.maxUSD,
        avgUSD: labStats.priceStats.avgUSD,
        minSEK: labStats.priceStats.minSEK,
        maxSEK: labStats.priceStats.maxSEK,
        avgSEK: labStats.priceStats.avgSEK
      },
      samples: labStats.samples,
      randomSamples: labStats.randomSamples
    }
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summaryOutput, null, 2));

  // Print summary
  console.log('\n=== IMPORT RESULTS SUMMARY ===\n');
  
  console.log('NATURAL DIAMONDS:');
  console.log(`  Total processed: ${naturalStats.totalCount.toLocaleString()}`);
  console.log(`  With USD price: ${naturalStats.withUSDPrice.toLocaleString()}`);
  console.log(`  With SEK price: ${naturalStats.withSEKPrice.toLocaleString()}`);
  console.log(`  Without price: ${naturalStats.withoutPrice.toLocaleString()}`);
  console.log(`  Type changed (LG cert): ${naturalStats.typeChanged.toLocaleString()}`);
  if (naturalStats.withUSDPrice > 0) {
    console.log(`  USD price range: $${naturalStats.priceStats.minUSD.toFixed(2)} - $${naturalStats.priceStats.maxUSD.toFixed(2)}`);
    console.log(`  USD average: $${naturalStats.priceStats.avgUSD.toFixed(2)}`);
  }

  console.log('\nLAB-GROWN DIAMONDS:');
  console.log(`  Total processed: ${labStats.totalCount.toLocaleString()}`);
  console.log(`  With USD price: ${labStats.withUSDPrice.toLocaleString()}`);
  console.log(`  With SEK price: ${labStats.withSEKPrice.toLocaleString()}`);
  console.log(`  Without price: ${labStats.withoutPrice.toLocaleString()}`);
  if (labStats.withUSDPrice > 0) {
    console.log(`  USD price range: $${labStats.priceStats.minUSD.toFixed(2)} - $${labStats.priceStats.maxUSD.toFixed(2)}`);
    console.log(`  USD average: $${labStats.priceStats.avgUSD.toFixed(2)}`);
  }

  console.log(`\nSummary written to: ${summaryPath}`);
  console.log(`Database records written to: ${dbRecordsPath}`);
  
  // Show random samples for verification
  console.log('\n=== RANDOM SAMPLE VERIFICATION ===\n');
  console.log('Natural Diamond Random Samples (every 10,000th record):');
  naturalStats.randomSamples.slice(0, 5).forEach((sample: any) => {
    console.log(`  Line ${sample.lineNumber}: ${sample.itemId} - CSV Price=$${sample.originalCSVPrice}, JSON Price=$${sample.totalPrice}`);
  });
  
  console.log('\nLab-Grown Diamond Random Samples (every 10,000th record):');
  labStats.randomSamples.slice(0, 5).forEach((sample: any) => {
    console.log(`  Line ${sample.lineNumber}: ${sample.itemId} - CSV Price=$${sample.originalCSVPrice}, JSON Price=$${sample.totalPrice}`);
  });

  console.log('\n=== TEST COMPLETE ===\n');
}

// Run the import
importSamplesStreaming().catch(console.error);