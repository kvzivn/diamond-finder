#!/usr/bin/env python3
import csv
import os

def peek_at_csv(file_path, diamond_type):
    """Look at first few rows to understand structure"""
    print(f"\n=== {diamond_type} Diamond CSV Structure ===")
    print(f"File: {file_path}")
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # Read first 5 rows
        for i, row in enumerate(reader):
            if i >= 5:
                break
            
            print(f"\nRow {i+1} has {len(row)} columns")
            
            # For natural diamonds, check columns 35-36
            if diamond_type == 'natural' and len(row) > 36:
                print(f"  Column 35 (Video URL): '{row[35]}'")
                print(f"  Column 36 (3D Viewer URL): '{row[36]}'")
                
            # For lab diamonds, check columns 100-101
            if diamond_type == 'lab' and len(row) > 101:
                print(f"  Column 100 (Video URL): '{row[100]}'")
                print(f"  Column 101 (3D Viewer URL): '{row[101]}'")
            elif diamond_type == 'lab':
                print(f"  Only {len(row)} columns - expected at least 102")
                
            # Show some basic diamond info
            if len(row) > 10:
                print(f"  Diamond ID: {row[0]}")
                print(f"  Cut: {row[1] if diamond_type == 'natural' else row[2]}")
                print(f"  Carat: {row[2] if diamond_type == 'natural' else row[3]}")

def find_non_empty_urls(file_path, diamond_type, max_rows=10000):
    """Find rows with actual URL content"""
    print(f"\n=== Searching for non-empty URLs in {diamond_type} diamonds ===")
    
    video_col = 35 if diamond_type == 'natural' else 100
    viewer_3d_col = 36 if diamond_type == 'natural' else 101
    
    found_video = []
    found_3d = []
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
                
            if len(row) > max(video_col, viewer_3d_col):
                video_url = row[video_col].strip()
                viewer_3d_url = row[viewer_3d_col].strip()
                
                if video_url and video_url.startswith('http'):
                    found_video.append({
                        'row': i,
                        'id': row[0],
                        'url': video_url
                    })
                    
                if viewer_3d_url and viewer_3d_url.startswith('http'):
                    found_3d.append({
                        'row': i,
                        'id': row[0],
                        'url': viewer_3d_url
                    })
                    
            if i % 1000 == 0:
                print(f"  Processed {i} rows... Found {len(found_video)} video URLs, {len(found_3d)} 3D URLs")
    
    print(f"\nResults for {diamond_type}:")
    print(f"  Total rows checked: {i}")
    print(f"  Found video URLs: {len(found_video)}")
    print(f"  Found 3D URLs: {len(found_3d)}")
    
    if found_video:
        print(f"\nFirst 5 Video URLs:")
        for item in found_video[:5]:
            print(f"  Row {item['row']}, ID {item['id']}: {item['url']}")
            
    if found_3d:
        print(f"\nFirst 5 3D URLs:")
        for item in found_3d[:5]:
            print(f"  Row {item['row']}, ID {item['id']}: {item['url']}")

def main():
    # Change to CSV directory
    os.chdir('scripts/diamond-url-samples')
    
    # First peek at the structure
    peek_at_csv('Idex_Feed_2025_08_01_17_48_11.csv', 'natural')
    peek_at_csv('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'lab')
    
    # Then search for actual URLs
    find_non_empty_urls('Idex_Feed_2025_08_01_17_48_11.csv', 'natural')
    find_non_empty_urls('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'lab')

if __name__ == '__main__':
    main()