#!/bin/bash

echo "=== DIAMOND PRICE VERIFICATION ==="
echo ""

# Function to extract price from CSV line
extract_csv_price() {
    local line="$1"
    # Total Price is the 20th column (index 19)
    echo "$line" | cut -d',' -f20
}

# Function to verify a diamond
verify_diamond() {
    local csv_file="$1"
    local item_id="$2"
    local type="$3"
    
    echo "Checking $type diamond $item_id:"
    
    # Find in CSV
    csv_line=$(grep "^$item_id," "$csv_file" | head -1)
    if [ -n "$csv_line" ]; then
        csv_price=$(extract_csv_price "$csv_line")
        echo "  CSV Price: \$$csv_price"
        
        # Find in JSON - extract the relevant section
        json_section=$(grep -A 20 "\"itemId\": \"$item_id\"" "data-samples/sample-import-db-records-full.json" | head -25)
        
        if [ -n "$json_section" ]; then
            json_price=$(echo "$json_section" | grep "\"totalPrice\":" | head -1 | sed 's/.*"totalPrice": \([0-9.]*\).*/\1/')
            json_sek=$(echo "$json_section" | grep "\"totalPriceSek\":" | head -1 | sed 's/.*"totalPriceSek": \([0-9.]*\).*/\1/')
            
            echo "  JSON Price: \$$json_price"
            echo "  JSON SEK: $json_sek"
            
            if [ "$csv_price" = "$json_price" ]; then
                echo "  Status: ✅ MATCH"
            else
                echo "  Status: ❌ MISMATCH (CSV: $csv_price, JSON: $json_price)"
            fi
        else
            echo "  ❌ Not found in JSON"
        fi
    else
        echo "  ❌ Not found in CSV"
    fi
    echo ""
}

echo "VERIFYING NATURAL DIAMONDS:"
echo ""

# Natural diamond samples
verify_diamond "data-samples/natural-full.csv" "498540240" "natural"
verify_diamond "data-samples/natural-full.csv" "498536743" "natural"
verify_diamond "data-samples/natural-full.csv" "498540229" "natural"
verify_diamond "data-samples/natural-full.csv" "122870891" "natural"
verify_diamond "data-samples/natural-full.csv" "122871224" "natural"

echo ""
echo "VERIFYING LAB-GROWN DIAMONDS:"
echo ""

# Lab diamond samples  
verify_diamond "data-samples/lab-full.csv" "358149526" "lab"
verify_diamond "data-samples/lab-full.csv" "388599089" "lab"
verify_diamond "data-samples/lab-full.csv" "417022519" "lab"
verify_diamond "data-samples/lab-full.csv" "256447483" "lab"
verify_diamond "data-samples/lab-full.csv" "257555306" "lab"

echo ""
echo "=== VERIFICATION COMPLETE ==="