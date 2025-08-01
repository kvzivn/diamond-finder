#!/usr/bin/env python3
import json
import os

def generate_html():
    # Load the 80 URLs (actually got 130, will use first 80)
    os.chdir('scripts/diamond-url-samples')
    with open('all_80_3d_urls.json', 'r') as f:
        all_urls = json.load(f)
    
    # Take first 80 URLs
    urls_to_use = all_urls[:80]
    
    # HTML template
    html_start = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Diamond 3D Viewer Gallery - 80 Examples</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f5f5f5;
            padding: 20px;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 10px;
        }
        .summary {
            text-align: center;
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .viewer-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(520px, 1fr));
            gap: 30px;
            justify-content: center;
        }
        .viewer-card {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .diamond-type {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 8px;
        }
        .natural {
            background-color: #e8f5e9;
            color: #2e7d32;
        }
        .lab {
            background-color: #e3f2fd;
            color: #1565c0;
        }
        .viewer-info {
            margin-bottom: 10px;
            font-size: 14px;
            color: #666;
        }
        .diamond-id {
            font-weight: bold;
            color: #333;
        }
        .price {
            float: right;
            font-weight: bold;
            color: #1976d2;
        }
        .url-display {
            background-color: #f5f5f5;
            padding: 8px;
            border-radius: 4px;
            font-size: 12px;
            word-break: break-all;
            margin-bottom: 10px;
            color: #555;
            border: 1px solid #ddd;
            max-height: 60px;
            overflow-y: auto;
        }
        iframe {
            border: 1px solid #ddd;
            border-radius: 4px;
            display: block;
            background-color: #fafafa;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Diamond 3D Viewer Gallery - 80 Examples</h1>
        <div class="summary">'''
    
    # Count natural vs lab
    natural_count = sum(1 for url in urls_to_use if url['type'] == 'natural')
    lab_count = sum(1 for url in urls_to_use if url['type'] == 'lab')
    
    html_start += f'{natural_count} Natural Diamonds | {lab_count} Lab-Grown Diamonds</div>\n        <div class="viewer-grid">\n'
    
    # Generate viewer cards
    viewer_cards = []
    for i, item in enumerate(urls_to_use):
        color = item.get('color', '').strip() or 'N/A'
        price = item.get('price', '').strip()
        price_display = f'${price}' if price and price.replace('.', '').isdigit() else ''
        
        card = f'''            <div class="viewer-card">
                <span class="diamond-type {item['type']}">{item['type']}</span>
                <div class="viewer-info">
                    <span class="diamond-id">Diamond #{item['id']}</span> - {item['carat']}ct {item['cut']} {color} {item['clarity']}
                    {f'<span class="price">{price_display}</span>' if price_display else ''}
                </div>
                <div class="url-display">{item['url']}</div>
                <iframe src="{item['url']}" 
                        width="500" height="500" frameborder="0" scrolling="no"></iframe>
            </div>
'''
        viewer_cards.append(card)
    
    html_end = '''        </div>
    </div>
</body>
</html>'''
    
    # Combine all parts
    full_html = html_start + '\n'.join(viewer_cards) + html_end
    
    # Save to file
    os.chdir('../..')
    with open('scripts/diamond-3d-viewers-80.html', 'w') as f:
        f.write(full_html)
    
    print(f"Generated HTML with {len(urls_to_use)} diamond viewers")
    print(f"Natural: {natural_count}, Lab: {lab_count}")
    print("Saved to: scripts/diamond-3d-viewers-80.html")

if __name__ == '__main__':
    generate_html()