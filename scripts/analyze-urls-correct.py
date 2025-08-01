#!/usr/bin/env python3
import csv
import os
import json
from collections import Counter
from urllib.parse import urlparse

def analyze_diamonds(file_path, diamond_type, video_col, viewer_3d_col, max_rows=50000):
    """Analyze diamond CSV for URL content"""
    print(f"\n=== Analyzing {diamond_type} diamonds ===")
    print(f"Video URL column: {video_col}, 3D Viewer column: {viewer_3d_col}")
    
    stats = {
        'total': 0,
        'with_video': 0,
        'with_3d': 0,
        'with_both': 0,
        'video_domains': Counter(),
        '3d_domains': Counter(),
        'samples': {
            'video': [],
            '3d': []
        }
    }
    
    with open(file_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header row
        
        for i, row in enumerate(reader):
            if i >= max_rows:
                break
                
            stats['total'] += 1
            
            if len(row) > max(video_col, viewer_3d_col):
                video_url = row[video_col].strip() if video_col < len(row) else ''
                viewer_3d_url = row[viewer_3d_col].strip() if viewer_3d_col < len(row) else ''
                
                has_video = video_url and video_url.startswith('http')
                has_3d = viewer_3d_url and viewer_3d_url.startswith('http')
                
                if has_video:
                    stats['with_video'] += 1
                    try:
                        domain = urlparse(video_url).netloc
                        stats['video_domains'][domain] += 1
                    except:
                        pass
                    
                    if len(stats['samples']['video']) < 10:
                        stats['samples']['video'].append({
                            'id': row[0],
                            'cut': row[2],
                            'carat': row[3],
                            'color': row[4],
                            'clarity': row[9],
                            'price': row[19],
                            'url': video_url
                        })
                
                if has_3d:
                    stats['with_3d'] += 1
                    try:
                        domain = urlparse(viewer_3d_url).netloc
                        stats['3d_domains'][domain] += 1
                    except:
                        pass
                        
                    if len(stats['samples']['3d']) < 10:
                        stats['samples']['3d'].append({
                            'id': row[0],
                            'cut': row[2],
                            'carat': row[3],
                            'color': row[4],
                            'clarity': row[9],
                            'price': row[19],
                            'url': viewer_3d_url
                        })
                
                if has_video and has_3d:
                    stats['with_both'] += 1
            
            if (i + 1) % 10000 == 0:
                print(f"  Processed {i + 1} rows...")
    
    return stats

def main():
    os.chdir('scripts/diamond-url-samples')
    
    # Analyze natural diamonds (Video URL at 16, 3D at 17)
    natural_stats = analyze_diamonds(
        'Idex_Feed_2025_08_01_17_48_11.csv',
        'Natural (Extended Format)',
        16,  # Video URL column
        17   # 3DViewer URL column
    )
    
    # For lab diamonds, let's check the actual column count first
    with open('Idex_Complete_LgSingles_2025_08_01_17_27_36.csv', 'r') as f:
        lab_header = next(csv.reader(f))
        print(f"\nLab diamond CSV has {len(lab_header)} columns")
        
        # Look for Video URL and 3D columns
        video_idx = None
        viewer_3d_idx = None
        for i, col in enumerate(lab_header):
            if 'video' in col.lower():
                video_idx = i
                print(f"Found 'Video' column at index {i}: {col}")
            if '3d' in col.lower() or 'viewer' in col.lower():
                viewer_3d_idx = i
                print(f"Found '3D/Viewer' column at index {i}: {col}")
    
    # If we didn't find video/3D columns in lab format, skip it
    lab_stats = None
    if video_idx is not None or viewer_3d_idx is not None:
        lab_stats = analyze_diamonds(
            'Idex_Complete_LgSingles_2025_08_01_17_27_36.csv',
            'Lab',
            video_idx or 999,  # Use high number if not found
            viewer_3d_idx or 999
        )
    
    # Print results
    print("\n=== RESULTS ===")
    
    all_stats = {'natural': natural_stats}
    if lab_stats:
        all_stats['lab'] = lab_stats
    
    for diamond_type, stats in all_stats.items():
        print(f"\n{diamond_type.upper()} DIAMONDS:")
        print(f"Total analyzed: {stats['total']:,}")
        print(f"With video URL: {stats['with_video']:,} ({stats['with_video']/stats['total']*100:.1f}%)")
        print(f"With 3D URL: {stats['with_3d']:,} ({stats['with_3d']/stats['total']*100:.1f}%)")
        print(f"With both: {stats['with_both']:,} ({stats['with_both']/stats['total']*100:.1f}%)")
        
        if stats['video_domains']:
            print(f"\nVideo domains:")
            for domain, count in stats['video_domains'].most_common(5):
                print(f"  {domain}: {count:,}")
        
        if stats['3d_domains']:
            print(f"\n3D Viewer domains:")
            for domain, count in stats['3d_domains'].most_common(5):
                print(f"  {domain}: {count:,}")
        
        if stats['samples']['video']:
            print(f"\nSample diamonds with video:")
            for s in stats['samples']['video'][:3]:
                print(f"  {s['id']}: {s['carat']}ct {s['cut']} {s['color']} {s['clarity']} ${s['price']}")
                print(f"    URL: {s['url']}")
        
        if stats['samples']['3d']:
            print(f"\nSample diamonds with 3D viewer:")
            for s in stats['samples']['3d'][:3]:
                print(f"  {s['id']}: {s['carat']}ct {s['cut']} {s['color']} {s['clarity']} ${s['price']}")
                print(f"    URL: {s['url']}")
    
    # Save detailed results
    results = {}
    for key, stats in all_stats.items():
        results[key] = {
            'total': stats['total'],
            'with_video': stats['with_video'],
            'with_3d': stats['with_3d'],
            'with_both': stats['with_both'],
            'video_domains': dict(stats['video_domains']),
            '3d_domains': dict(stats['3d_domains']),
            'samples': stats['samples']
        }
    
    with open('diamond_url_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDetailed results saved to: diamond_url_analysis.json")

if __name__ == '__main__':
    main()