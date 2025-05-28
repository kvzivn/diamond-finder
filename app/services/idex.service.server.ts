import JSZip from 'jszip';
import type { Diamond, DiamondType } from '../models/diamond.server';

const IDEX_API_BASE_URL = 'https://api.idexonline.com/onsite/api';

// --- CSV Headers --- //
const NATURAL_DIAMOND_HEADERS = [
  'Item ID #', 'Supplier Stock Ref.', 'Cut', 'Carat', 'Color', 'Natural Fancy Color', 'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone', 'Treated Color', 'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number', 'Certificate Path', 'Image Path', 'Online Report', 'Video URL', '3DViewer URL', 'Price Per Carat', 'Total Price', '% Off IDEX List', 'Polish', 'Symmetry', 'Measurements Length', 'Measurements Width', 'Measurements Height', 'Depth', 'Table', 'Crown Height', 'Crown Angle', 'Pavilion Depth', 'Pavilion Angle', 'Girdle From', 'Girdle To', 'Culet Size', 'Culet Condition', 'Graining', 'Fluorescence Intensity', 'Fluorescence Color', 'Enhancement', 'Country', 'State / Region', 'Pair Stock Ref.', 'Asking Price For Pair', 'Shade', 'Milky', 'Black Inclusion', 'Eye Clean', 'Provenance Report', 'Provenance Number', 'Brand', 'Guaranteed Availability', '_EMPTY_FIELD_'
];

const LAB_GROWN_DIAMOND_HEADERS = [
  'Item ID', 'Supplier Stock Ref', 'Cut', 'Carat', 'Color', 'Natural Fancy Color', 'Natural Fancy Color Intensity', 'Natural Fancy Color Overtone', 'Treated Color', 'Clarity', 'Cut Grade', 'Grading Lab', 'Certificate Number', 'Certificate URL', 'Image URL', 'Online Report URL', 'Polish', 'Symmetry', 'Price Per Carat', 'Total Price', 'Measurements Length', 'Measurements Width', 'Measurements Height', 'Depth', 'Table', 'Crown Height', 'Crown Angle', 'Pavilion Depth', 'Pavilion Angle', 'Girdle From', 'Girdle To', 'Culet Size', 'Culet Condition', 'Graining', 'Fluorescence Intensity', 'Fluorescence Color', 'Enhancement', 'Country Code', 'Country Name', 'State Code', 'State Name', 'Pair Stock Ref', 'Pair Separable', 'Asking Price Per Carat For Pair', 'Shade', 'Milky', 'Black Inclusion', 'Eye Clean', 'Provenance Report', 'Provenance Number', 'Brand', 'Availability', 'Video URL', '3DViewer URL'
];

// Helper to convert header names to camelCase Diamond interface keys
function headerToCamelCase(header: string): keyof Diamond | '_EMPTY_FIELD_' {
  // Specific mappings for clarity and consistency
  const map: Record<string, keyof Diamond | '_EMPTY_FIELD_'> = {
    'Item ID #': 'itemId',
    'Item ID': 'itemId',
    'Supplier Stock Ref.': 'supplierStockRef',
    'Supplier Stock Ref': 'supplierStockRef',
    'Cut': 'cut',
    'Carat': 'carat',
    'Color': 'color',
    'Natural Fancy Color': 'naturalFancyColor',
    'Natural Fancy Color Intensity': 'naturalFancyColorIntensity',
    'Natural Fancy Color Overtone': 'naturalFancyColorOvertone',
    'Treated Color': 'treatedColor',
    'Clarity': 'clarity',
    'Cut Grade': 'cutGrade',
    'Grading Lab': 'gradingLab',
    'Certificate Number': 'certificateNumber',
    'Certificate Path': 'certificatePath', // Natural
    'Certificate URL': 'certificateUrl', // Lab
    'Image Path': 'imagePath', // Natural
    'Image URL': 'imagePath', // Lab - Unified to imagePath
    'Online Report': 'onlineReport', // Natural
    'Online Report URL': 'onlineReportUrl', // Lab
    'Video URL': 'videoUrl',
    '3DViewer URL': 'threeDViewerUrl',
    'Price Per Carat': 'pricePerCarat',
    'Total Price': 'totalPrice',
    '% Off IDEX List': 'percentOffIdexList',
    'Polish': 'polish',
    'Symmetry': 'symmetry',
    'Measurements Length': 'measurementsLength',
    'Measurements Width': 'measurementsWidth',
    'Measurements Height': 'measurementsHeight',
    'Depth': 'depthPercent',
    'Table': 'tablePercent',
    'Crown Height': 'crownHeight',
    'Crown Angle': 'crownAngle',
    'Pavilion Depth': 'pavilionDepth',
    'Pavilion Angle': 'pavilionAngle',
    'Girdle From': 'girdleFrom',
    'Girdle To': 'girdleTo',
    'Culet Size': 'culetSize',
    'Culet Condition': 'culetCondition',
    'Graining': 'graining',
    'Fluorescence Intensity': 'fluorescenceIntensity',
    'Fluorescence Color': 'fluorescenceColor',
    'Enhancement': 'enhancement',
    'Country': 'country', // Natural
    'Country Code': 'countryCode', // Lab
    'Country Name': 'countryName', // Lab
    'State / Region': 'stateRegion', // Natural
    'State Code': 'stateCode', // Lab
    'State Name': 'stateName', // Lab
    'Pair Stock Ref.': 'pairStockRef',
    'Pair Stock Ref': 'pairStockRef',
    'Pair Separable': 'pairSeparable',
    'Asking Price For Pair': 'askingPriceForPair',
    'Asking Price Per Carat For Pair': 'askingPricePerCaratForPair',
    'Shade': 'shade',
    'Milky': 'milky',
    'Black Inclusion': 'blackInclusion',
    'Eye Clean': 'eyeClean',
    'Provenance Report': 'provenanceReport',
    'Provenance Number': 'provenanceNumber',
    'Brand': 'brand',
    'Guaranteed Availability': 'guaranteedAvailability',
    'Availability': 'availability',
    '_EMPTY_FIELD_': '_EMPTY_FIELD_'
  };
  return map[header] || header.toLowerCase().replace(/\s+\(?\w*\)?/g, '').replace(/\W/g, '') as keyof Diamond;
}

function parseCSV(csvString: string, headers: string[]): Diamond[] {
  const lines = csvString.trim().split('\n');
  // Some APIs might include a header row in the CSV data itself.
  // If the first line matches a known pattern of headers, skip it.
  // For now, assuming IDEX CSV does NOT include headers in the data based on earlier findings.
  // const dataLines = lines.slice(lines[0].includes(headers[0]) ? 1 : 0);

  const diamondKeys = headers.map(headerToCamelCase);

  return lines.map(line => {
    const values = line.split(',');
    const diamond: Partial<Diamond> = {};
    diamondKeys.forEach((key, index) => {
      if (key === '_EMPTY_FIELD_') return;
      if (values[index] !== undefined && values[index].trim() !== '') {
        const value = values[index].trim();
        // Basic type conversion - extend as needed
        if (key === 'carat' || key === 'pricePerCarat' || key === 'totalPrice' || key === 'percentOffIdexList' ||
            key === 'measurementsLength' || key === 'measurementsWidth' || key === 'measurementsHeight' ||
            key === 'depthPercent' || key === 'tablePercent' || key === 'crownHeight' || key === 'crownAngle' ||
            key === 'pavilionDepth' || key === 'pavilionAngle' || key === 'askingPriceForPair' || key === 'askingPricePerCaratForPair') {
          (diamond as any)[key] = parseFloat(value);
        } else if (key === 'pairSeparable') {
          (diamond as any)[key] = value.toLowerCase() === 'yes' ? true : (value.toLowerCase() === 'no' ? false : value);
        } else {
          (diamond as any)[key] = value;
        }
      }
    });
    return diamond as Diamond; // Assuming essential fields like itemId will be present
  }).filter(d => d.itemId); // Ensure a diamond has an itemId
}

export async function fetchDiamondsFromApi(type: DiamondType): Promise<Diamond[]> {
  const apiKey = process.env.IDEX_API_KEY;
  const apiSecret = process.env.IDEX_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error('IDEX API key or secret is not configured in environment variables.');
  }

  let endpoint = '';
  let dataFormat = '';
  let headers: string[] = [];

  if (type === 'natural') {
    endpoint = `${IDEX_API_BASE_URL}/fullfeed`;
    dataFormat = 'format_20220525_basis';
    headers = NATURAL_DIAMOND_HEADERS;
  } else if (type === 'lab') {
    endpoint = `${IDEX_API_BASE_URL}/labgrownfullfile`;
    dataFormat = 'format_lg_20221130';
    headers = LAB_GROWN_DIAMOND_HEADERS;
  } else {
    throw new Error(`Unsupported diamond type: ${type}`);
  }

  console.log(`Fetching ${type} diamonds from IDEX API... Format: ${dataFormat}`);

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
        create_zip_file: true, // Always true now
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('IDEX API Error:', response.status, errorBody);
    throw new Error(`Failed to fetch diamonds from IDEX API: ${response.status} - ${errorBody}`);
  }

  const zipArrayBuffer = await response.arrayBuffer();
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipArrayBuffer);

  // Find the CSV file in the zip. Assuming there's only one or it has a predictable name.
  // This might need adjustment if the CSV filename is not consistent.
  const csvFile = Object.values(zip.files).find(file => file.name.toLowerCase().endsWith('.csv'));

  if (!csvFile) {
    throw new Error('CSV file not found in the downloaded ZIP archive.');
  }

  console.log(`Found CSV file in ZIP: ${csvFile.name}`);
  const csvString = await csvFile.async('string');

  console.log(`Parsing CSV data for ${type} diamonds...`);
  const diamonds = parseCSV(csvString, headers);

  // Log the first few diamond objects and total count for inspection
  if (diamonds.length > 0) {
    console.log(`[IDEX SERVICE] Parsed ${diamonds.length} ${type} diamonds. First 3 objects:`);
    console.log(JSON.stringify(diamonds.slice(0, 3), null, 2)); // Pretty print first 3
  } else {
    console.log(`[IDEX SERVICE] No ${type} diamonds found or parsed.`);
  }

  console.log(`Successfully parsed ${diamonds.length} ${type} diamonds.`);
  return diamonds;
}