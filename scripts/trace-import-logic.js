import fs from 'fs';

// Copied from idex.service.server.ts
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

function traceImportLogic() {
  console.log('=== TRACING IMPORT LOGIC ===\n');
  
  const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const line2 = lines[1]; // Diamond 122870891
  
  console.log('1. Headers and their mapping:');
  headers.forEach((header, index) => {
    const key = headerToCamelCase(header);
    if (header.includes('Price')) {
      console.log(`  [${index}] "${header}" → "${key}" ← PRICE FIELD`);
    }
  });
  
  console.log('\n2. Processing diamond 122870891:');
  const values = line2.split(',');
  const diamond = {};
  
  headers.forEach((header, index) => {
    const key = headerToCamelCase(header);
    if (key === '_EMPTY_FIELD_' && header !== 'Measurements (LengthxWidthxHeight)' && header !== 'Girdle (From / To)') {
      return;
    }
    
    const rawValue = values[index];
    if (rawValue !== undefined && rawValue.trim() !== '') {
      const value = rawValue.trim();
      
      // Check if this field needs parseFloat
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
        if (key === 'pricePerCarat' || key === 'totalPrice') {
          console.log(`    ${key}: "${value}" → ${parseFloat(value)} (parsed as float) ← PRICE`);
        }
      } else {
        diamond[key] = value;
      }
    }
  });
  
  console.log('\n3. Final diamond object prices:');
  console.log(`  pricePerCarat: ${diamond.pricePerCarat}`);
  console.log(`  totalPrice: ${diamond.totalPrice}`);
  console.log(`  itemId: ${diamond.itemId}`);
  console.log(`  carat: ${diamond.carat}`);
  
  if (diamond.pricePerCarat && diamond.totalPrice) {
    console.log('  ✅ Prices parsed successfully!');
  } else {
    console.log('  ❌ Prices missing or null!');
  }
}

traceImportLogic();