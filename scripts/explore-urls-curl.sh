#!/bin/bash

# Load environment variables
source .env

echo "=== IDEX Diamond URL Explorer (Curl Version) ==="
echo ""

# Create output directory
OUTPUT_DIR="scripts/diamond-url-samples"
mkdir -p "$OUTPUT_DIR"

# Function to download diamonds
download_diamonds() {
    local TYPE=$1
    local ENDPOINT=$2
    local FORMAT=$3
    local OUTPUT_FILE=$4
    
    echo "Downloading $TYPE diamonds (format: $FORMAT)..."
    
    # Create the request payload
    PAYLOAD=$(cat <<EOF
{
    "authentication_details": {
        "api_key": "$IDEX_API_KEY",
        "api_secret": "$IDEX_API_SECRET"
    },
    "parameters": {
        "file_format": "csv",
        "data_format": "$FORMAT",
        "create_zip_file": true
    }
}
EOF
)
    
    # Download the ZIP file
    curl -X POST "$ENDPOINT" \
        -H "Content-Type: application/json" \
        -d "$PAYLOAD" \
        -o "$OUTPUT_FILE" \
        --progress-bar
    
    if [ $? -eq 0 ]; then
        echo "✓ Downloaded $TYPE diamonds to $OUTPUT_FILE"
        echo "  File size: $(ls -lh "$OUTPUT_FILE" | awk '{print $5}')"
    else
        echo "✗ Failed to download $TYPE diamonds"
        return 1
    fi
}

# Download natural diamonds with extended format
download_diamonds \
    "natural" \
    "https://api.idexonline.com/onsite/api/fullfeed" \
    "format_20230628_extended" \
    "$OUTPUT_DIR/natural_extended.zip"

# Download lab diamonds (already has Video and 3D URLs)
download_diamonds \
    "lab" \
    "https://api.idexonline.com/onsite/api/labgrownfullfile" \
    "format_lg_20221130" \
    "$OUTPUT_DIR/lab.zip"

echo ""
echo "Downloads complete! Now you can:"
echo "1. Unzip the files to examine the CSV data"
echo "2. Look for Video URL and 3DViewer URL columns"
echo ""
echo "To unzip and examine:"
echo "  cd $OUTPUT_DIR"
echo "  unzip -l natural_extended.zip  # List contents"
echo "  unzip natural_extended.zip     # Extract"