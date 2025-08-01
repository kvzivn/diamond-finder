#!/usr/bin/env python3
import csv
import json
import os

def extract_3d_urls(file_path, diamond_type, viewer_3d_col, limit=100, skip=0):
    """Extract unique 3D viewer URLs with skip option"""
    urls = []
    seen = set()
    skipped = 0
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        next(reader)  # Skip header
        
        for i, row in enumerate(reader):
            if len(urls) >= limit:
                break
                
            if len(row) > viewer_3d_col:
                url = row[viewer_3d_col].strip()
                
                if url and url.startswith('http') and url not in seen:
                    if skipped < skip:
                        skipped += 1
                        seen.add(url)
                        continue
                        
                    seen.add(url)
                    urls.append({
                        'url': url,
                        'id': row[0],
                        'type': diamond_type,
                        'cut': row[2] if diamond_type == 'natural' else row[2],
                        'carat': row[3] if diamond_type == 'natural' else row[3],
                        'color': row[4] if diamond_type == 'natural' else row[4],
                        'clarity': row[9] if diamond_type == 'natural' else row[9],
                        'price': row[19] if diamond_type == 'natural' else row[19]
                    })
    
    return urls

def main():
    os.chdir('scripts/diamond-url-samples')
    
    # Extract 40 natural and 40 lab diamonds (80 total)
    # Skip the first 25 of each that we already used
    natural_urls = extract_3d_urls('Idex_Feed_2025_08_01_17_48_11.csv', 'natural', 17, 40, skip=25)
    lab_urls = extract_3d_urls('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'lab', 53, 40, skip=25)
    
    # Also load the original 30 we already have
    with open('extracted_3d_urls.json', 'r') as f:
        original_30 = json.load(f)
    
    # Combine all 80
    all_urls = original_30 + natural_urls + lab_urls
    
    # Save to JSON
    with open('all_80_3d_urls.json', 'w') as f:
        json.dump(all_urls, f, indent=2)
    
    print(f"Total URLs: {len(all_urls)}")
    print(f"Original: 30")
    print(f"New Natural: {len(natural_urls)}")
    print(f"New Lab: {len(lab_urls)}")
    print("Saved to: all_80_3d_urls.json")
    
    # Show some stats
    domains = {}
    for item in all_urls:
        try:
            from urllib.parse import urlparse
            domain = urlparse(item['url']).netloc
            domains[domain] = domains.get(domain, 0) + 1
        except:
            pass
    
    print("\nTop domains:")
    for domain, count in sorted(domains.items(), key=lambda x: x[1], reverse=True)[:10]:
        print(f"  {domain}: {count}")

if __name__ == '__main__':
    main()