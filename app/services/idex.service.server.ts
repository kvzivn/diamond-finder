import JSZip from 'jszip';
import type { Diamond, DiamondType } from '../models/diamond.server';

const IDEX_API_BASE_URL = 'https://api.idexonline.com/onsite/api';

// --- CSV Headers --- //
const NATURAL_DIAMOND_HEADERS = [
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
  '_EMPTY_FIELD_',
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

// Helper to convert header names to camelCase Diamond interface keys
function headerToCamelCase(header: string): keyof Diamond | '_EMPTY_FIELD_' {
  // Specific mappings for clarity and consistency
  const map: Record<string, keyof Diamond | '_EMPTY_FIELD_'> = {
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
      .replace(/\s+\(?\w*\)?/g, '')
      .replace(/\W/g, '') as keyof Diamond)
  );
}

function parseCSV(csvString: string, headers: string[]): Diamond[] {
  const lines = csvString.trim().split('\n');
  // Some APIs might include a header row in the CSV data itself.
  // If the first line matches a known pattern of headers, skip it.
  // For now, assuming IDEX CSV does NOT include headers in the data based on earlier findings.
  // const dataLines = lines.slice(lines[0].includes(headers[0]) ? 1 : 0);

  const diamondKeys = headers.map(headerToCamelCase);

  return lines
    .map((line) => {
      const values = line.split(',');
      const diamond: Partial<Diamond> = {};

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
            // Basic type conversion - extend as needed
            if (
              key === 'carat' ||
              key === 'pricePerCarat' ||
              key === 'totalPrice' ||
              key === 'percentOffIdexList' ||
              key === 'measurementsLength' ||
              key === 'measurementsWidth' ||
              key === 'measurementsHeight' || // Already handled if header was 'Measurements (LengthxWidthxHeight)'
              key === 'depthPercent' ||
              key === 'tablePercent' ||
              key === 'crownHeight' ||
              key === 'crownAngle' ||
              key === 'pavilionDepth' ||
              key === 'pavilionAngle' ||
              key === 'askingPriceForPair' ||
              key === 'askingPricePerCaratForPair'
            ) {
              (diamond as any)[key] = parseFloat(value);
            } else if (key === 'pairSeparable') {
              (diamond as any)[key] =
                value.toLowerCase() === 'yes'
                  ? true
                  : value.toLowerCase() === 'no'
                    ? false
                    : value;
            } else {
              (diamond as any)[key] = value;
            }
          }
        }
      });
      return diamond as Diamond; // Assuming essential fields like itemId will be present
    })
    .filter((d) => d.itemId); // Ensure a diamond has an itemId
}

// Function to fetch USD to SEK exchange rate from Open Exchange Rates API
async function getUsdToSekExchangeRate(): Promise<number> {
  const appId = process.env.EXCHANGE_RATE_APP_ID;

  if (!appId) {
    throw new Error(
      'EXCHANGE_RATE_APP_ID is not configured in environment variables.'
    );
  }

  console.log(
    '[ExchangeRateService] Fetching USD to SEK exchange rate from Open Exchange Rates...'
  );

  try {
    const response = await fetch(
      `https://openexchangerates.org/api/latest.json?app_id=${appId}&symbols=SEK`
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch exchange rate: ${response.status} - ${errorBody}`
      );
    }

    const data = await response.json();
    const sekRate = data.rates?.SEK;

    if (!sekRate || typeof sekRate !== 'number') {
      throw new Error('SEK rate not found in API response');
    }

    console.log(`[ExchangeRateService] Current USD to SEK rate: ${sekRate}`);
    return sekRate;
  } catch (error) {
    console.error('[ExchangeRateService] Error fetching exchange rate:', error);
    throw error;
  }
}

export async function fetchDiamondsFromApi(
  type: DiamondType
): Promise<Diamond[]> {
  const apiKey = process.env.IDEX_API_KEY;
  const apiSecret = process.env.IDEX_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error(
      'IDEX API key or secret is not configured in environment variables.'
    );
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

  console.log(
    `Fetching ${type} diamonds from IDEX API... Format: ${dataFormat}`
  );

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
    throw new Error(
      `Failed to fetch diamonds from IDEX API: ${response.status} - ${errorBody}`
    );
  }

  const zipArrayBuffer = await response.arrayBuffer();
  const jszip = new JSZip();
  const zip = await jszip.loadAsync(zipArrayBuffer);

  // Find the CSV file in the zip. Assuming there's only one or it has a predictable name.
  // This might need adjustment if the CSV filename is not consistent.
  const csvFile = Object.values(zip.files).find((file) =>
    file.name.toLowerCase().endsWith('.csv')
  );

  if (!csvFile) {
    throw new Error('CSV file not found in the downloaded ZIP archive.');
  }

  console.log(`Found CSV file in ZIP: ${csvFile.name}`);
  const csvString = await csvFile.async('string');

  console.log(`Parsing CSV data for ${type} diamonds...`);
  let diamonds = parseCSV(csvString, headers);

  // Fetch exchange rate and convert prices to SEK
  try {
    const exchangeRate = await getUsdToSekExchangeRate();

    // Convert USD prices to SEK
    diamonds = diamonds.map((diamond) => {
      const diamondWithSek = { ...diamond };
      if (typeof diamond.totalPrice === 'number') {
        diamondWithSek.totalPriceSek = parseFloat(
          (diamond.totalPrice * exchangeRate).toFixed(2)
        );
      }
      return diamondWithSek;
    });

    console.log(
      `[IDEX SERVICE] Applied USD to SEK conversion for ${diamonds.length} diamonds using rate: ${exchangeRate}`
    );
  } catch (error) {
    console.error(
      '[IDEX SERVICE] Failed to fetch exchange rate or apply currency conversion. Proceeding with USD prices only.',
      error
    );
    // Continue without SEK conversion - diamonds will only have USD prices
  }

  // Log the first few diamond objects and total count for inspection
  if (diamonds.length > 0) {
    console.log(
      `[IDEX SERVICE] Parsed ${diamonds.length} ${type} diamonds. First 3 objects:`
    );
    console.log(JSON.stringify(diamonds.slice(0, 3), null, 2)); // Pretty print first 3

    // ADD THIS: Look specifically for fancy colored diamonds
    const fancyColoredDiamonds = diamonds.filter(
      (d) =>
        d.naturalFancyColor ||
        d.naturalFancyColorIntensity ||
        (d.color &&
          (d.color.toLowerCase().includes('fancy') ||
            d.color.toLowerCase().includes('yellow') ||
            d.color.toLowerCase().includes('pink') ||
            d.color.toLowerCase().includes('blue')))
    );

    if (fancyColoredDiamonds.length > 0) {
      console.log(
        `[IDEX SERVICE] Found ${fancyColoredDiamonds.length} potential fancy colored diamonds. First 5:`
      );
      console.log(
        JSON.stringify(
          fancyColoredDiamonds.slice(0, 5).map((d) => ({
            itemId: d.itemId,
            color: d.color,
            naturalFancyColor: d.naturalFancyColor,
            naturalFancyColorIntensity: d.naturalFancyColorIntensity,
            naturalFancyColorOvertone: d.naturalFancyColorOvertone,
            cut: d.cut,
          })),
          null,
          2
        )
      );
    } else {
      console.log(
        `[IDEX SERVICE] No fancy colored diamonds found in this batch`
      );
    }
  } else {
    console.log(`[IDEX SERVICE] No ${type} diamonds found or parsed.`);
  }

  console.log(`Successfully parsed ${diamonds.length} ${type} diamonds.`);
  return diamonds;
}
