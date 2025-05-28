export interface Diamond {
  itemId: string; // Item ID # / Item ID
  supplierStockRef?: string; // Supplier Stock Ref.
  cut?: string; // Cut
  carat?: number; // Carat
  color?: string; // Color
  naturalFancyColor?: string; // Natural Fancy Color
  naturalFancyColorIntensity?: string; // Natural Fancy Color Intensity
  naturalFancyColorOvertone?: string; // Natural Fancy Color Overtone
  treatedColor?: string; // Treated Color
  clarity?: string; // Clarity
  cutGrade?: string; // Cut Grade
  gradingLab?: string; // Grading Lab
  certificateNumber?: string; // Certificate Number
  certificatePath?: string; // Certificate Path (Natural)
  certificateUrl?: string; // Certificate URL (Lab)
  imagePath?: string; // Image Path (Natural)
  imageUrl?: string; // Image URL (Lab)
  onlineReport?: string; // Online Report (Natural)
  onlineReportUrl?: string; // Online Report URL (Lab)
  videoUrl?: string; // Video URL
  threeDViewerUrl?: string; // 3DViewer URL
  pricePerCarat?: number; // Price Per Carat
  totalPrice?: number; // Total Price
  totalPriceSek?: number; // Total Price in Swedish Krona
  percentOffIdexList?: number; // % Off IDEX List (Natural)
  polish?: string; // Polish
  symmetry?: string; // Symmetry
  measurementsLength?: number; // Measurements Length
  measurementsWidth?: number; // Measurements Width
  measurementsHeight?: number; // Measurements Height
  depthPercent?: number; // Depth (assuming this is depth %)
  tablePercent?: number; // Table (assuming this is table %)
  crownHeight?: number; // Crown Height
  crownAngle?: number; // Crown Angle
  pavilionDepth?: number; // Pavilion Depth
  pavilionAngle?: number; // Pavilion Angle
  girdleFrom?: string; // Girdle From
  girdleTo?: string; // Girdle To
  culetSize?: string; // Culet Size
  culetCondition?: string; // Culet Condition
  graining?: string; // Graining
  fluorescenceIntensity?: string; // Fluorescence Intensity
  fluorescenceColor?: string; // Fluorescence Color
  enhancement?: string; // Enhancement
  country?: string; // Country (Natural)
  countryCode?: string; // Country Code (Lab)
  countryName?: string; // Country Name (Lab) - can be mapped from countryCode if needed
  stateRegion?: string; // State / Region (Natural)
  stateCode?: string; // State Code (Lab)
  stateName?: string; // State Name (Lab) - can be mapped from stateCode if needed
  pairStockRef?: string; // Pair Stock Ref.
  pairSeparable?: boolean | string; // Pair Separable (Lab) - string 'Yes'/'No' or boolean
  askingPriceForPair?: number; // Asking Price For Pair (Natural)
  askingPricePerCaratForPair?: number; // Asking Price Per Carat For Pair (Lab)
  shade?: string; // Shade
  milky?: string; // Milky
  blackInclusion?: string; // Black Inclusion
  eyeClean?: string; // Eye Clean
  provenanceReport?: string; // Provenance Report
  provenanceNumber?: string; // Provenance Number
  brand?: string; // Brand
  guaranteedAvailability?: string; // Guaranteed Availability (Natural)
  availability?: string; // Availability (Lab)
  // The last "[EMPTY FIELD]" is omitted as it likely carries no value
}

export type DiamondType = 'natural' | 'lab';

export interface CachedDiamonds {
  data: Diamond[];
  fetchedAt: Date;
}