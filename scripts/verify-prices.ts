#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Find a diamond by itemId in CSV file
async function findDiamondInCSV(csvPath: string, itemId: string, type: 'natural' | 'lab'): Promise<any> {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let lineNumber = 0;
  const priceColumnIndex = type === 'natural' ? 19 : 19; // "Total Price" is column 20 (index 19) for both

  for await (const line of rl) {
    lineNumber++;
    
    // Skip header
    if (lineNumber === 1) continue;
    
    const values = line.split(',');
    const currentItemId = values[0].trim();
    
    if (currentItemId === itemId) {
      const totalPrice = values[priceColumnIndex]?.trim();
      rl.close();
      return {
        found: true,
        lineNumber,
        itemId: currentItemId,
        totalPrice: totalPrice ? parseFloat(totalPrice) : null,
        rawLine: line.substring(0, 200)
      };
    }
  }
  
  rl.close();
  return { found: false, itemId };
}

// Find diamond in JSON output
async function findDiamondInJSON(jsonPath: string, itemId: string, type: 'natural' | 'lab'): Promise<any> {
  // For large files, we'll stream search
  const fileContent = fs.readFileSync(jsonPath, 'utf-8');
  
  // Use regex to find the specific diamond without parsing entire JSON
  const pattern = new RegExp(`"itemId":\\s*"${itemId}"[^}]*?}[^}]*?}`, 's');
  const match = fileContent.match(pattern);
  
  if (match) {
    // Extract just the matched diamond object
    const diamondStr = '{' + match[0].substring(match[0].indexOf('"itemId"'));
    try {
      // Find totalPrice in the match
      const priceMatch = diamondStr.match(/"totalPrice":\s*([\d.]+)/);
      const sekMatch = diamondStr.match(/"totalPriceSek":\s*([\d.]+)/);
      const origMatch = diamondStr.match(/"originalCSVPrice":\s*([\d.]+)/);
      
      return {
        found: true,
        itemId,
        totalPrice: priceMatch ? parseFloat(priceMatch[1]) : null,
        totalPriceSek: sekMatch ? parseFloat(sekMatch[1]) : null,
        originalCSVPrice: origMatch ? parseFloat(origMatch[1]) : null
      };
    } catch (e) {
      return { found: false, itemId, error: 'Parse error' };
    }
  }
  
  return { found: false, itemId };
}

async function verifyPrices() {
  console.log('=== DIAMOND PRICE VERIFICATION ===\n');
  
  // Read the summary to get random samples
  const summaryPath = path.join(__dirname, '..', 'data-samples', 'sample-import-results-full.json');
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
  
  // Natural diamonds to verify
  const naturalSamples = [
    ...summary.natural.randomSamples.slice(0, 5),
    // Add specific IDs from the beginning
    { itemId: '122870891' },
    { itemId: '122871224' }
  ];
  
  // Lab diamonds to verify  
  const labSamples = [
    ...summary.lab.randomSamples.slice(0, 5),
    // Add specific IDs from the beginning
    { itemId: '256447483' },
    { itemId: '257555306' }
  ];
  
  console.log('VERIFYING NATURAL DIAMONDS:\n');
  const naturalCsvPath = path.join(__dirname, '..', 'data-samples', 'natural-full.csv');
  const jsonPath = path.join(__dirname, '..', 'data-samples', 'sample-import-db-records-full.json');
  
  for (const sample of naturalSamples) {
    console.log(`Checking diamond ${sample.itemId}:`);
    
    // Find in CSV
    const csvResult = await findDiamondInCSV(naturalCsvPath, sample.itemId, 'natural');
    
    // Find in JSON
    const jsonResult = await findDiamondInJSON(jsonPath, sample.itemId, 'natural');
    
    if (csvResult.found && jsonResult.found) {
      const match = csvResult.totalPrice === jsonResult.totalPrice;
      const sekCorrect = jsonResult.totalPriceSek === (jsonResult.totalPrice * 10.5);
      
      console.log(`  CSV: Line ${csvResult.lineNumber}, Price = $${csvResult.totalPrice}`);
      console.log(`  JSON: totalPrice = $${jsonResult.totalPrice}, SEK = ${jsonResult.totalPriceSek}`);
      console.log(`  Status: ${match ? '✅ MATCH' : '❌ MISMATCH'}, SEK conversion: ${sekCorrect ? '✅' : '❌'}`);
    } else {
      console.log(`  ❌ Not found in ${!csvResult.found ? 'CSV' : 'JSON'}`);
    }
    console.log('');
  }
  
  console.log('\nVERIFYING LAB-GROWN DIAMONDS:\n');
  const labCsvPath = path.join(__dirname, '..', 'data-samples', 'lab-full.csv');
  
  for (const sample of labSamples) {
    console.log(`Checking diamond ${sample.itemId}:`);
    
    // Find in CSV
    const csvResult = await findDiamondInCSV(labCsvPath, sample.itemId, 'lab');
    
    // Find in JSON
    const jsonResult = await findDiamondInJSON(jsonPath, sample.itemId, 'lab');
    
    if (csvResult.found && jsonResult.found) {
      const match = csvResult.totalPrice === jsonResult.totalPrice;
      const sekCorrect = Math.abs(jsonResult.totalPriceSek - (jsonResult.totalPrice * 10.5)) < 0.01;
      
      console.log(`  CSV: Line ${csvResult.lineNumber}, Price = $${csvResult.totalPrice}`);
      console.log(`  JSON: totalPrice = $${jsonResult.totalPrice}, SEK = ${jsonResult.totalPriceSek}`);
      console.log(`  Status: ${match ? '✅ MATCH' : '❌ MISMATCH'}, SEK conversion: ${sekCorrect ? '✅' : '❌'}`);
    } else {
      console.log(`  ❌ Not found in ${!csvResult.found ? 'CSV' : 'JSON'}`);
    }
    console.log('');
  }
  
  // Summary statistics
  console.log('=== SUMMARY STATISTICS ===\n');
  console.log('Natural Diamonds:');
  console.log(`  Total: ${summary.natural.totalCount.toLocaleString()}`);
  console.log(`  With prices: ${summary.natural.withUSDPrice.toLocaleString()} (${(summary.natural.withUSDPrice / summary.natural.totalCount * 100).toFixed(1)}%)`);
  console.log(`  Price range: $${summary.natural.priceStats.minUSD.toFixed(2)} - $${summary.natural.priceStats.maxUSD.toFixed(2)}`);
  
  console.log('\nLab-Grown Diamonds:');
  console.log(`  Total: ${summary.lab.totalCount.toLocaleString()}`);
  console.log(`  With prices: ${summary.lab.withUSDPrice.toLocaleString()} (${(summary.lab.withUSDPrice / summary.lab.totalCount * 100).toFixed(1)}%)`);
  console.log(`  Price range: $${summary.lab.priceStats.minUSD.toFixed(2)} - $${summary.lab.priceStats.maxUSD.toFixed(2)}`);
}

// Run verification
verifyPrices().catch(console.error);