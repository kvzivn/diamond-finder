import JSZip from 'jszip';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const IDEX_API_BASE_URL = 'https://api.idexonline.com/onsite/api';

// Extended format headers for natural diamonds
const NATURAL_EXTENDED_HEADERS = [
  'Item ID #',
  'Cut',
  'Carat',
  'Color',
  'Natural Fancy Color',
  'Natural Fancy Color Intensity',
  'Natural Fancy Color Overtone',
  'Treated Color',
  'Clarity',
  'Make (Cut Grade)',
  'Grading Lab',
  'Certificate Number',
  'Certificate Path',
  'Image Path',
  'Online Report',
  'Price Per Carat',
  'Total Price',
  '% Off IDEX List',
  'Polish',
  'Symmetry',
  'Measurements (LengthxWidthxHeight)',
  'Depth',
  'Table',
  'Crown Height',
  'Pavilion Depth',
  'Girdle (From / To)',
  'Culet Size',
  'Culet Condition',
  'Graining',
  'Fluorescence Intensity',
  'Fluorescence Color',
  'Enhancement',
  'Country',
  'State / Region',
  'Pair Stock Ref.',
  'Video URL',
  '3DViewer URL',
];

async function fetchDiamonds(type, format, limit = 500) {
  const apiKey = process.env.IDEX_API_KEY;
  const apiSecret = process.env.IDEX_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('IDEX API credentials not found in environment variables');
  }

  let endpoint = '';
  let dataFormat = '';

  if (type === 'natural') {
    endpoint = `${IDEX_API_BASE_URL}/fullfeed`;
    dataFormat = format;
  } else if (type === 'lab') {
    endpoint = `${IDEX_API_BASE_URL}/labgrownfullfile`;
    dataFormat = 'format_lg_20221130'; // Lab format already includes Video and 3D URLs
  }

  console.log(`\nFetching ${type} diamonds with format: ${dataFormat}...`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      authentication_details: {
        api_key: apiKey,
        api_secret: apiSecret,
      },
      parameters: {
        file_format: 'csv',
        data_format: dataFormat,
        create_zip_file: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API Error: ${response.status} - ${errorBody}`);
  }

  console.log(`Downloading ZIP file for ${type} diamonds...`);
  const zipArrayBuffer = await response.arrayBuffer();
  
  // Save the zip file for reference
  const zipPath = path.join(__dirname, `${type}_diamonds_${format}.zip`);
  await fs.writeFile(zipPath, Buffer.from(zipArrayBuffer));
  console.log(`Saved ZIP file to: ${zipPath}`);

  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipArrayBuffer);

  const csvFile = Object.values(zip.files).find((file) =>
    file.name.toLowerCase().endsWith('.csv')
  );

  if (!csvFile) {
    throw new Error('CSV file not found in ZIP');
  }

  console.log(`Extracting CSV: ${csvFile.name}`);
  const csvString = await csvFile.async('string');
  
  // Parse CSV
  const lines = csvString.trim().split('\n');
  console.log(`Total diamonds in CSV: ${lines.length}`);

  // Get sample diamonds
  const sampleLines = lines.slice(0, limit);
  const diamonds = [];

  for (const line of sampleLines) {
    const values = line.split(',');
    const diamond = {};
    
    // For natural extended format
    if (type === 'natural') {
      diamond.itemId = values[0];
      diamond.cut = values[1];
      diamond.carat = values[2];
      diamond.color = values[3];
      diamond.clarity = values[8];
      diamond.certificateNumber = values[11];
      diamond.imagePath = values[13];
      diamond.pricePerCarat = values[15];
      diamond.totalPrice = values[16];
      diamond.videoUrl = values[35];
      diamond.threeDViewerUrl = values[36];
    } else {
      // Lab format - Video URL is at index 100, 3DViewer URL at 101
      diamond.itemId = values[0];
      diamond.cut = values[2];
      diamond.carat = values[3];
      diamond.color = values[4];
      diamond.clarity = values[9];
      diamond.certificateNumber = values[12];
      diamond.imageUrl = values[14];
      diamond.pricePerCarat = values[18];
      diamond.totalPrice = values[19];
      diamond.videoUrl = values[100];
      diamond.threeDViewerUrl = values[101];
    }

    diamonds.push(diamond);
  }

  return diamonds;
}

async function exploreDiamondUrls() {
  try {
    console.log('=== IDEX Diamond URL Explorer ===\n');
    
    // Fetch natural diamonds with extended format
    const naturalDiamonds = await fetchDiamonds('natural', 'format_20230628_extended', 500);
    
    // Fetch lab diamonds (already has Video and 3D URLs)
    const labDiamonds = await fetchDiamonds('lab', null, 500);

    // Create output directory
    const outputDir = path.join(__dirname, 'diamond-url-samples');
    await fs.mkdir(outputDir, { recursive: true });

    // Find diamonds with Video or 3D URLs
    const naturalWithUrls = naturalDiamonds.filter(d => d.videoUrl || d.threeDViewerUrl);
    const labWithUrls = labDiamonds.filter(d => d.videoUrl || d.threeDViewerUrl);

    console.log(`\n=== Results ===`);
    console.log(`Natural diamonds with URLs: ${naturalWithUrls.length}/${naturalDiamonds.length}`);
    console.log(`Lab diamonds with URLs: ${labWithUrls.length}/${labDiamonds.length}`);

    // Save samples to JSON files
    const naturalSample = {
      totalSampled: naturalDiamonds.length,
      withUrls: naturalWithUrls.length,
      samples: naturalWithUrls.slice(0, 50).map(d => ({
        itemId: d.itemId,
        carat: d.carat,
        color: d.color,
        clarity: d.clarity,
        certificateNumber: d.certificateNumber,
        videoUrl: d.videoUrl,
        threeDViewerUrl: d.threeDViewerUrl,
        imagePath: d.imagePath,
        totalPrice: d.totalPrice
      }))
    };

    const labSample = {
      totalSampled: labDiamonds.length,
      withUrls: labWithUrls.length,
      samples: labWithUrls.slice(0, 50).map(d => ({
        itemId: d.itemId,
        carat: d.carat,
        color: d.color,
        clarity: d.clarity,
        certificateNumber: d.certificateNumber,
        videoUrl: d.videoUrl,
        threeDViewerUrl: d.threeDViewerUrl,
        imageUrl: d.imageUrl,
        totalPrice: d.totalPrice
      }))
    };

    await fs.writeFile(
      path.join(outputDir, 'natural-diamonds-with-urls.json'),
      JSON.stringify(naturalSample, null, 2)
    );

    await fs.writeFile(
      path.join(outputDir, 'lab-diamonds-with-urls.json'),
      JSON.stringify(labSample, null, 2)
    );

    console.log(`\nSample files saved to: ${outputDir}`);

    // Print some examples
    console.log('\n=== Natural Diamond URL Examples ===');
    naturalWithUrls.slice(0, 3).forEach(d => {
      console.log(`\nDiamond ${d.itemId}:`);
      console.log(`  Video URL: ${d.videoUrl || 'None'}`);
      console.log(`  3D Viewer URL: ${d.threeDViewerUrl || 'None'}`);
    });

    console.log('\n=== Lab Diamond URL Examples ===');
    labWithUrls.slice(0, 3).forEach(d => {
      console.log(`\nDiamond ${d.itemId}:`);
      console.log(`  Video URL: ${d.videoUrl || 'None'}`);
      console.log(`  3D Viewer URL: ${d.threeDViewerUrl || 'None'}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the exploration
exploreDiamondUrls();