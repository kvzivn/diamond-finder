import fs from 'fs';

function debugAllValues() {
  console.log('=== DEBUGGING ALL VALUES IN LINE 9 ===\n');
  
  const csvContent = fs.readFileSync('/Users/bae/dev/diamond-finder/debug-fresh-sample.csv', 'utf8');
  const lines = csvContent.split('\n');
  
  const headers = lines[0].split(',').map(h => h.trim());
  const line9 = lines[8]; // 0-indexed (line 9 is index 8)
  
  const values = line9.split(',');
  
  console.log('Headers and values side by side:');
  for (let i = 0; i < Math.max(headers.length, values.length); i++) {
    const header = headers[i] || 'MISSING HEADER';
    const value = values[i] || 'MISSING VALUE';
    const important = header.includes('Price') || header.includes('Video') ? ' ← IMPORTANT' : '';
    console.log(`[${i.toString().padStart(2)}] ${header.padEnd(30)} = "${value}"${important}`);
  }
}

debugAllValues();