import { Pool } from 'pg';
import { randomUUID } from 'crypto';

// Simple test to isolate the bulk insert issue
async function testBulkInsert() {
  console.log('=== SIMPLE BULK INSERT TEST ===\n');
  
  const pool = new Pool({
    connectionString: 'postgresql://bae@localhost:5432/diamond_finder_local',
    max: 5
  });
  
  try {
    // Create test diamonds
    const testDiamonds = [
      {
        itemId: "TEST-001",
        carat: 1.0,
        color: "G",
        clarity: "VS1",
        cut: "Round",
        totalPrice: 5000
      },
      {
        itemId: "TEST-002", 
        carat: 0.8,
        color: "H", 
        clarity: "SI1",
        cut: "Princess",
        totalPrice: 3000
      }
    ];
    
    console.log(`Testing bulk insert with ${testDiamonds.length} diamonds`);
    
    const client = await pool.connect();
    
    try {
      const values = [];
      const placeholders = [];
      const importJobId = randomUUID();
      const now = new Date();
      
      testDiamonds.forEach((diamond, index) => {
        const baseIndex = index * 70;
        placeholders.push(
          `(${Array.from({ length: 70 }, (_, i) => `$${baseIndex + i + 1}`).join(', ')})`
        );
        
        // Add all 70 values for each diamond
        values.push(
          randomUUID(), // id
          diamond.itemId, // itemId
          null, // supplierStockRef
          diamond.cut, // cut
          diamond.carat, // carat
          diamond.color, // color
          null, // naturalFancyColor
          null, // naturalFancyColorIntensity
          null, // naturalFancyColorOvertone
          null, // treatedColor
          diamond.clarity, // clarity
          null, // cutGrade
          null, // gradingLab
          null, // certificateNumber
          null, // certificatePath
          null, // certificateUrl
          null, // imagePath
          null, // imageUrl
          null, // onlineReport
          null, // onlineReportUrl
          null, // videoUrl
          null, // threeDViewerUrl
          null, // pricePerCarat
          diamond.totalPrice, // totalPrice
          null, // totalPriceSek
          null, // priceWithMarkupSek
          null, // finalPriceSek
          null, // percentOffIdexList
          null, // polish
          null, // symmetry
          null, // measurementsLength
          null, // measurementsWidth
          null, // measurementsHeight
          null, // depthPercent
          null, // tablePercent
          null, // crownHeight
          null, // crownAngle
          null, // pavilionDepth
          null, // pavilionAngle
          null, // girdleFrom
          null, // girdleTo
          null, // culetSize
          null, // culetCondition
          null, // graining
          null, // fluorescenceIntensity
          null, // fluorescenceColor
          null, // enhancement
          null, // country
          null, // countryCode
          null, // countryName
          null, // stateRegion
          null, // stateCode
          null, // stateName
          null, // pairStockRef
          null, // pairSeparable
          null, // askingPriceForPair
          null, // askingPricePerCaratForPair
          null, // shade
          null, // milky
          null, // blackInclusion
          null, // eyeClean
          null, // provenanceReport
          null, // provenanceNumber
          null, // brand
          null, // guaranteedAvailability
          null, // availability
          'lab', // type
          now, // createdAt
          now, // updatedAt
          importJobId // importJobId
        );
      });
      
      console.log(`Generated ${placeholders.length} placeholders`);
      console.log(`Generated ${values.length} values`);
      console.log(`Expected: ${placeholders.length * 70} values`);
      console.log(`Match: ${values.length === placeholders.length * 70}`);
      
      if (values.length !== placeholders.length * 70) {
        console.error('❌ Parameter count mismatch!');
        return;
      }
      
      const query = `
        INSERT INTO "Diamond" (
          id, "itemId", "supplierStockRef", cut, carat, color, "naturalFancyColor",
          "naturalFancyColorIntensity", "naturalFancyColorOvertone", "treatedColor", clarity,
          "cutGrade", "gradingLab", "certificateNumber", "certificatePath", "certificateUrl",
          "imagePath", "imageUrl", "onlineReport", "onlineReportUrl", "videoUrl", "threeDViewerUrl",
          "pricePerCarat", "totalPrice", "totalPriceSek", "priceWithMarkupSek", "finalPriceSek", "percentOffIdexList", polish, symmetry,
          "measurementsLength", "measurementsWidth", "measurementsHeight", "depthPercent",
          "tablePercent", "crownHeight", "crownAngle", "pavilionDepth", "pavilionAngle",
          "girdleFrom", "girdleTo", "culetSize", "culetCondition", graining,
          "fluorescenceIntensity", "fluorescenceColor", enhancement, country, "countryCode",
          "countryName", "stateRegion", "stateCode", "stateName", "pairStockRef", "pairSeparable",
          "askingPriceForPair", "askingPricePerCaratForPair", shade, milky, "blackInclusion",
          "eyeClean", "provenanceReport", "provenanceNumber", brand, "guaranteedAvailability",
          availability, type, "createdAt", "updatedAt", "importJobId"
        ) VALUES ${placeholders.join(', ')}
        ON CONFLICT ("itemId") DO UPDATE SET
          "totalPrice" = EXCLUDED."totalPrice",
          "updatedAt" = EXCLUDED."updatedAt"
      `;
      
      console.log('\\nExecuting query...');
      console.log(`Query length: ${query.length} characters`);
      console.log(`First placeholder: ${placeholders[0]}`);
      console.log(`Sample values: ${values.slice(0, 5).join(', ')}...`);
      
      const result = await client.query(query, values);
      
      console.log(`✅ SUCCESS! Inserted ${result.rowCount} rows`);
      
    } catch (error) {
      console.error('❌ Query execution failed:', error.message);
      console.error('Error code:', error.code);
      console.error('Error detail:', error.detail);
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await pool.end();
  }
}

testBulkInsert();