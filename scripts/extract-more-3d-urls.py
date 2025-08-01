#!/usr/bin/env python3
import csv
import json
import os

def extract_3d_urls(file_path, diamond_type, viewer_3d_col, limit=50):
    """Extract unique 3D viewer URLs"""
    urls = []
    seen = set()
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for i, row in enumerate(reader):
            if len(urls) >= limit:
                break
                
            if len(row) > viewer_3d_col:
                url = row[viewer_3d_col].strip()
                
                if url and url.startswith('http') and url not in seen:
                    seen.add(url)
                    urls.append({
                        'url': url,
                        'id': row[0],
                        'type': diamond_type,
                        'cut': row[2] if diamond_type == 'natural' else row[2],
                        'carat': row[3] if diamond_type == 'natural' else row[3],
                        'color': row[4] if diamond_type == 'natural' else row[4],
                        'clarity': row[9] if diamond_type == 'natural' else row[9]
                    })
    
    return urls

def main():
    os.chdir('scripts/diamond-url-samples')
    
    # Extract from natural diamonds (3D at column 17)
    natural_urls = extract_3d_urls('Idex_Feed_2025_08_01_17_48_11.csv', 'natural', 17, 25)
    
    # Extract from lab diamonds (3D at column 53)
    lab_urls = extract_3d_urls('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'lab', 53, 25)
    
    all_urls = natural_urls + lab_urls
    
    # Save to JSON
    with open('extracted_3d_urls.json', 'w') as f:
        json.dump(all_urls, f, indent=2)
    
    print(f"Extracted {len(natural_urls)} natural and {len(lab_urls)} lab diamond 3D URLs")
    print("Saved to: extracted_3d_urls.json")
    
    # Print first few for verification
    for i, item in enumerate(all_urls[:5]):
        print(f"\n{item['type'].upper()} #{item['id']}: {item['carat']}ct {item['cut']} {item['color']} {item['clarity']}")
        print(f"  {item['url']}")

if __name__ == '__main__':
    main()