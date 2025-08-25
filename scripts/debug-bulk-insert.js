import fs from 'fs';
import { randomUUID } from 'crypto';

// Test the bulk insert logic with sample data to see what's going wrong
function testBulkInsertLogic() {
  console.log('=== DEBUGGING BULK INSERT LOGIC ===\n');
  
  // Create sample diamond data similar to what would come from CSV
  const sampleDiamonds = [
    {
      itemId: "123456",
      carat: 1.0,
      color: "G",
      clarity: "VS1",
      cut: "Round",
      totalPrice: 5000,
      type: 'lab'
    },
    {
      itemId: "123457", 
      carat: 0.8,
      color: "H",
      clarity: "SI1",
      cut: "Princess",
      totalPrice: 3000,
      type: 'lab'
    },
    {
      itemId: undefined, // This should be filtered out
      carat: 0.5,
      color: "I",
      clarity: "VS2"
    }
  ];
  
  console.log(`Testing with ${sampleDiamonds.length} sample diamonds`);
  
  const type = 'lab';
  const importJobId = randomUUID();
  
  // Simulate the diamondsWithIds mapping
  const diamondsWithIds = sampleDiamonds.map((diamond) => {
    const isTypeChanged = (diamond)._shouldBeLabType && type === 'natural';
    return {
      ...diamond,
      id: randomUUID(),
      type: (diamond)._shouldBeLabType ? 'lab' : type,
      importJobId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
  
  console.log(`After adding IDs: ${diamondsWithIds.length} diamonds`);
  diamondsWithIds.forEach((d, i) => {
    console.log(`  ${i}: itemId="${d.itemId}", type="${d.type}", id="${d.id}"`);
  });
  
  // Build the VALUES clause for bulk insert
  const values = [];
  const placeholders = [];

  let processedCount = 0;
  let skippedCount = 0;

  diamondsWithIds.forEach((diamond, index) => {
    // Validate essential fields
    if (!diamond.itemId) {
      console.warn(`[DEBUG] Skipping diamond ${index}: missing itemId`);
      skippedCount++;
      return;
    }

    const baseIndex = values.length; // Use current values length for proper indexing
    placeholders.push(
      `(${Array.from({ length: 70 }, (_, i) => `$${baseIndex + i + 1}`).join(', ')})`
    );

    values.push(
      diamond.id || null,
      diamond.itemId || null,
      diamond.supplierStockRef || null,
      diamond.cut || null,
      diamond.carat || null,
      diamond.color || null,
      diamond.naturalFancyColor || null,
      diamond.naturalFancyColorIntensity || null,
      diamond.naturalFancyColorOvertone || null,
      diamond.treatedColor || null,
      diamond.clarity || null,
      diamond.cutGrade || null,
      diamond.gradingLab || null,
      diamond.certificateNumber || null,
      diamond.certificatePath || null,
      diamond.certificateUrl || null,
      diamond.imagePath || null,
      diamond.imageUrl || null,
      diamond.onlineReport || null,
      diamond.onlineReportUrl || null,
      diamond.videoUrl || null,
      diamond.threeDViewerUrl || null,
      diamond.pricePerCarat || null,
      diamond.totalPrice || null,
      diamond.totalPriceSek || null,
      diamond.priceWithMarkupSek || null,
      diamond.finalPriceSek || null,
      diamond.percentOffIdexList || null,
      diamond.polish || null,
      diamond.symmetry || null,
      diamond.measurementsLength || null,
      diamond.measurementsWidth || null,
      diamond.measurementsHeight || null,
      diamond.depthPercent || null,
      diamond.tablePercent || null,
      diamond.crownHeight || null,
      diamond.crownAngle || null,
      diamond.pavilionDepth || null,
      diamond.pavilionAngle || null,
      diamond.girdleFrom || null,
      diamond.girdleTo || null,
      diamond.culetSize || null,
      diamond.culetCondition || null,
      diamond.graining || null,
      diamond.fluorescenceIntensity || null,
      diamond.fluorescenceColor || null,
      diamond.enhancement || null,
      diamond.country || null,
      diamond.countryCode || null,
      diamond.countryName || null,
      diamond.stateRegion || null,
      diamond.stateCode || null,
      diamond.stateName || null,
      diamond.pairStockRef || null,
      diamond.pairSeparable || null,
      diamond.askingPriceForPair || null,
      diamond.askingPricePerCaratForPair || null,
      diamond.shade || null,
      diamond.milky || null,
      diamond.blackInclusion || null,
      diamond.eyeClean || null,
      diamond.provenanceReport || null,
      diamond.provenanceNumber || null,
      diamond.brand || null,
      diamond.guaranteedAvailability || null,
      diamond.availability || null,
      diamond.type || type,
      diamond.createdAt || new Date(),
      diamond.updatedAt || new Date(),
      diamond.importJobId || importJobId
    );
    
    processedCount++;
    console.log(`[DEBUG] Added diamond ${index}: ${70} values (total values: ${values.length})`);
  });

  console.log(`\\n=== RESULTS ===`);
  console.log(`Original diamonds: ${sampleDiamonds.length}`);
  console.log(`After ID mapping: ${diamondsWithIds.length}`);
  console.log(`Processed: ${processedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Placeholders: ${placeholders.length}`);
  console.log(`Values: ${values.length}`);
  console.log(`Expected params: ${placeholders.length * 70}`);
  console.log(`Actual params: ${values.length}`);
  console.log(`Match: ${values.length === placeholders.length * 70}`);
  
  // Test the validation logic
  if (placeholders.length === 0 || values.length === 0) {
    console.warn(`\\n❌ No valid diamonds to insert`);
    return;
  }

  const expectedParams = placeholders.length * 70;
  if (values.length !== expectedParams) {
    console.error(`\\n❌ Parameter mismatch: expected ${expectedParams}, got ${values.length}`);
    return;
  }
  
  console.log(`\\n✅ Logic test passed! Would generate valid SQL.`);
  console.log(`Sample placeholder: ${placeholders[0]}`);
  console.log(`First 10 values: ${values.slice(0, 10).join(', ')}`);
}

testBulkInsertLogic();