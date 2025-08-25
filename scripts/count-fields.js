// Count fields in INSERT statement
const insertFields = `
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
`;

// Split by comma and count, removing whitespace
const fields = insertFields.split(',').map(f => f.trim()).filter(f => f.length > 0);
console.log(`Total fields in INSERT: ${fields.length}`);

fields.forEach((field, index) => {
  console.log(`${index + 1}: ${field}`);
});