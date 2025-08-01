#!/usr/bin/env python3
import csv
import json
from collections import Counter
from urllib.parse import urlparse
import os

def analyze_csv(file_path, diamond_type, sample_size=500):
    """Analyze a diamond CSV file for URL patterns"""
    print(f"\n=== Analyzing {diamond_type} diamonds ===")
    print(f"File: {file_path}")
    
    results = {
        'type': diamond_type,
        'total_rows': 0,
        'rows_with_video': 0,
        'rows_with_3d': 0,
        'rows_with_both': 0,
        'video_domains': Counter(),
        '3d_domains': Counter(),
        'sample_urls': {
            'video': [],
            '3d': []
        }
    }
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        
        # For natural diamonds, Video URL is at index 35, 3D at 36
        # For lab diamonds, Video URL is at index 100, 3D at 101
        video_idx = 35 if diamond_type == 'natural' else 100
        viewer_3d_idx = 36 if diamond_type == 'natural' else 101
        
        for i, row in enumerate(reader):
            if i >= sample_size:
                break
                
            results['total_rows'] += 1
            
            # Get URLs
            video_url = row[video_idx].strip() if len(row) > video_idx else ''
            viewer_3d_url = row[viewer_3d_idx].strip() if len(row) > viewer_3d_idx else ''
            
            has_video = bool(video_url)
            has_3d = bool(viewer_3d_url)
            
            if has_video:
                results['rows_with_video'] += 1
                # Extract domain
                try:
                    domain = urlparse(video_url).netloc
                    results['video_domains'][domain] += 1
                    # Add to samples
                    if len(results['sample_urls']['video']) < 10:
                        results['sample_urls']['video'].append({
                            'diamond_id': row[0],
                            'url': video_url,
                            'carat': row[2] if diamond_type == 'natural' else row[3],
                            'color': row[3] if diamond_type == 'natural' else row[4],
                            'clarity': row[8] if diamond_type == 'natural' else row[9]
                        })
                except:
                    pass
                    
            if has_3d:
                results['rows_with_3d'] += 1
                # Extract domain
                try:
                    domain = urlparse(viewer_3d_url).netloc
                    results['3d_domains'][domain] += 1
                    # Add to samples
                    if len(results['sample_urls']['3d']) < 10:
                        results['sample_urls']['3d'].append({
                            'diamond_id': row[0],
                            'url': viewer_3d_url,
                            'carat': row[2] if diamond_type == 'natural' else row[3],
                            'color': row[3] if diamond_type == 'natural' else row[4],
                            'clarity': row[8] if diamond_type == 'natural' else row[9]
                        })
                except:
                    pass
                    
            if has_video and has_3d:
                results['rows_with_both'] += 1
    
    # Convert Counter to dict for JSON serialization
    results['video_domains'] = dict(results['video_domains'])
    results['3d_domains'] = dict(results['3d_domains'])
    
    return results

def main():
    # Change to the directory containing the CSV files
    script_dir = os.path.dirname(os.path.abspath(__file__))
    csv_dir = os.path.join(script_dir, 'diamond-url-samples')
    os.chdir(csv_dir)
    
    # Analyze natural diamonds
    natural_results = analyze_csv('Idex_Feed_2025_08_01_17_48_11.csv', 'natural', 2000)
    
    # Analyze lab diamonds  
    lab_results = analyze_csv('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'lab', 2000)
    
    # Save results
    with open('url_analysis_results.json', 'w') as f:
        json.dump({
            'natural': natural_results,
            'lab': lab_results
        }, f, indent=2)
    
    # Print summary
    print("\n=== SUMMARY ===")
    for diamond_type, results in [('Natural', natural_results), ('Lab', lab_results)]:
        print(f"\n{diamond_type} Diamonds:")
        print(f"  Total analyzed: {results['total_rows']}")
        print(f"  With video URL: {results['rows_with_video']} ({results['rows_with_video']/results['total_rows']*100:.1f}%)")
        print(f"  With 3D URL: {results['rows_with_3d']} ({results['rows_with_3d']/results['total_rows']*100:.1f}%)")
        print(f"  With both: {results['rows_with_both']} ({results['rows_with_both']/results['total_rows']*100:.1f}%)")
        
        if results['video_domains']:
            print(f"\n  Video URL domains:")
            for domain, count in sorted(results['video_domains'].items(), key=lambda x: x[1], reverse=True):
                print(f"    {domain}: {count}")
                
        if results['3d_domains']:
            print(f"\n  3D Viewer domains:")
            for domain, count in sorted(results['3d_domains'].items(), key=lambda x: x[1], reverse=True):
                print(f"    {domain}: {count}")
        
        print(f"\n  Sample Video URLs:")
        for sample in results['sample_urls']['video'][:3]:
            print(f"    Diamond {sample['diamond_id']} ({sample['carat']}ct {sample['color']} {sample['clarity']}):")
            print(f"      {sample['url']}")
            
        print(f"\n  Sample 3D URLs:")
        for sample in results['sample_urls']['3d'][:3]:
            print(f"    Diamond {sample['diamond_id']} ({sample['carat']}ct {sample['color']} {sample['clarity']}):")
            print(f"      {sample['url']}")
    
    print(f"\nDetailed analysis saved to: url_analysis_results.json")

if __name__ == '__main__':
    main()