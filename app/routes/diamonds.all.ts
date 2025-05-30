import { json, LoaderFunctionArgs } from '@remix-run/node';
import { getCachedDiamonds } from '../services/diamond-cache.server';
import { refreshDiamondCacheByType } from '../services/diamond-updater.server';
import type { Diamond } from '../models/diamond.server'; // Assuming Diamond model exists

function applyFilters(diamonds: Diamond[], filters: {
  shape?: string;
  minPrice?: number;
  maxPrice?: number;
  minPriceSek?: number;
  maxPriceSek?: number;
  minCarat?: number;
  maxCarat?: number;
  type?: string;
  gradingLab?: string;
  minFluorescence?: string;
  maxFluorescence?: string;
}): Diamond[] {
  let filtered = [...diamonds];

  // Shape filter (using 'cut' property for shape)
  if (filters.shape) {
    filtered = filtered.filter(d => {
      const diamondShape = d.cut ? d.cut.toUpperCase() : '';
      return diamondShape === filters.shape!.toUpperCase();
    });
  }

  // SEK Price filters (prioritize SEK over USD)
  if (filters.minPriceSek !== undefined) {
    filtered = filtered.filter(d => d.totalPriceSek !== null && d.totalPriceSek !== undefined && d.totalPriceSek >= filters.minPriceSek!);
  } else if (filters.minPrice !== undefined) {
    // Fallback to USD price if SEK not available
    filtered = filtered.filter(d => d.totalPrice !== null && d.totalPrice !== undefined && d.totalPrice >= filters.minPrice!);
  }

  if (filters.maxPriceSek !== undefined) {
    filtered = filtered.filter(d => d.totalPriceSek !== null && d.totalPriceSek !== undefined && d.totalPriceSek <= filters.maxPriceSek!);
  } else if (filters.maxPrice !== undefined) {
    // Fallback to USD price if SEK not available
    filtered = filtered.filter(d => d.totalPrice !== null && d.totalPrice !== undefined && d.totalPrice <= filters.maxPrice!);
  }

  // Carat filters
  if (filters.minCarat !== undefined) {
    filtered = filtered.filter(d => d.carat !== null && d.carat !== undefined && d.carat >= filters.minCarat!);
  }
  if (filters.maxCarat !== undefined) {
    filtered = filtered.filter(d => d.carat !== null && d.carat !== undefined && d.carat <= filters.maxCarat!);
  }

  // Grading Lab filter
  if (filters.gradingLab) {
    if (filters.gradingLab === 'NONE') {
      // If 'NONE' is passed, filter out all diamonds
      filtered = [];
    } else {
      const allowedLabs = filters.gradingLab.split(',').map(lab => lab.trim().toUpperCase());
      filtered = filtered.filter(d => {
        const diamondLab = d.gradingLab ? d.gradingLab.toUpperCase() : '';
        return allowedLabs.includes(diamondLab);
      });
    }
  }

  // Fluorescence filter
  if (filters.minFluorescence || filters.maxFluorescence) {
    const fluorescenceLabels = ['Very Strong', 'Strong', 'Medium', 'Faint', 'None'];

    filtered = filtered.filter(d => {
      const diamondFluorescence = d.fluorescenceIntensity ? d.fluorescenceIntensity.trim() : '';

      // Find the index of the diamond's fluorescence in our scale
      const diamondFluorescenceIndex = fluorescenceLabels.findIndex(label =>
        label.toLowerCase() === diamondFluorescence.toLowerCase()
      );

      // If the diamond's fluorescence is not in our defined scale, exclude it
      if (diamondFluorescenceIndex === -1) return false;

      let withinRange = true;

      // Check minimum fluorescence
      if (filters.minFluorescence) {
        const minIndex = fluorescenceLabels.findIndex(label =>
          label.toLowerCase() === filters.minFluorescence!.toLowerCase()
        );
        if (minIndex !== -1 && diamondFluorescenceIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum fluorescence
      if (filters.maxFluorescence) {
        const maxIndex = fluorescenceLabels.findIndex(label =>
          label.toLowerCase() === filters.maxFluorescence!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondFluorescenceIndex > maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  return filtered;
}

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("TEST_VAR from .env:", process.env.TEST_VAR);
  console.log("IDEX_API_KEY from .env:", process.env.IDEX_API_KEY ? "Loaded" : "NOT LOADED");
  console.log("IDEX_API_SECRET from .env:", process.env.IDEX_API_SECRET ? "Loaded" : "NOT LOADED");
  // No explicit authentication call here; relying on App Proxy

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "24"); // Changed default to 24 to match frontend

  // Extract filter parameters
  const filters = {
    shape: url.searchParams.get("shape") || undefined,
    minPrice: url.searchParams.get("minPrice") ? parseFloat(url.searchParams.get("minPrice")!) : undefined,
    maxPrice: url.searchParams.get("maxPrice") ? parseFloat(url.searchParams.get("maxPrice")!) : undefined,
    minPriceSek: url.searchParams.get("minPriceSek") ? parseFloat(url.searchParams.get("minPriceSek")!) : undefined,
    maxPriceSek: url.searchParams.get("maxPriceSek") ? parseFloat(url.searchParams.get("maxPriceSek")!) : undefined,
    minCarat: url.searchParams.get("minCarat") ? parseFloat(url.searchParams.get("minCarat")!) : undefined,
    maxCarat: url.searchParams.get("maxCarat") ? parseFloat(url.searchParams.get("maxCarat")!) : undefined,
    type: url.searchParams.get("type") || undefined,
    gradingLab: url.searchParams.get("gradingLab") || undefined,
    minFluorescence: url.searchParams.get("minFluorescence") || undefined,
    maxFluorescence: url.searchParams.get("maxFluorescence") || undefined,
  };

  console.log('API Route (/all): Received filters:', JSON.stringify(filters, null, 2));

  let naturalDiamonds: Diamond[] = getCachedDiamonds('natural') || [];
  let labDiamonds: Diamond[] = getCachedDiamonds('lab') || [];

  // It's possible the cache was populated between the getCachedDiamonds call and this check,
  // but for simplicity, we check the initially retrieved values.
  // refreshDiamondCacheByType is designed to be idempotent and not run if a refresh is already in progress.
  if (naturalDiamonds.length === 0) { // Check if initially empty
    const currentNaturalDiamonds = getCachedDiamonds('natural'); // Re-check, might have been populated
    if(!currentNaturalDiamonds || currentNaturalDiamonds.length === 0) {
        console.log('API Route (/all): Cache potentially empty for natural. Triggering background refresh.');
        refreshDiamondCacheByType('natural').catch((err: Error) => {
          console.error('API Route (/all): Background refresh for natural failed:', err.message);
        });
    } else {
        naturalDiamonds = currentNaturalDiamonds; // Use the re-checked data
    }
  }

  if (labDiamonds.length === 0) { // Check if initially empty
    const currentLabDiamonds = getCachedDiamonds('lab'); // Re-check
    if(!currentLabDiamonds || currentLabDiamonds.length === 0) {
        console.log('API Route (/all): Cache potentially empty for lab. Triggering background refresh.');
        refreshDiamondCacheByType('lab').catch((err: Error) => {
          console.error('API Route (/all): Background refresh for lab failed:', err.message);
        });
    } else {
        labDiamonds = currentLabDiamonds; // Use the re-checked data
    }
  }

  // Filter diamonds by type if specified
  let allDiamonds: Diamond[];
  if (filters.type === 'Natural') {
    allDiamonds = naturalDiamonds;
  } else if (filters.type === 'Lab Grown') {
    allDiamonds = labDiamonds;
  } else {
    allDiamonds = [...naturalDiamonds, ...labDiamonds];
  }

  // Apply filters to the full dataset
  const filteredDiamonds = applyFilters(allDiamonds, filters);

  console.log(`API Route (/all): Applied filters. Total diamonds: ${allDiamonds.length}, Filtered: ${filteredDiamonds.length}`);

  const totalFilteredDiamonds = filteredDiamonds.length;
  const totalNaturalDiamonds = naturalDiamonds.length;
  const totalLabDiamonds = labDiamonds.length;

  // Apply pagination to filtered results
  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedDiamonds = filteredDiamonds.slice(startIndex, endIndex);

  return json({
    diamonds: paginatedDiamonds,
    totalDiamonds: totalFilteredDiamonds, // Total after filtering
    totalNaturalDiamonds,
    totalLabDiamonds,
    currentPage: page,
    totalPages: Math.ceil(totalFilteredDiamonds / limit),
    limit,
    appliedFilters: filters, // Include applied filters in response for debugging
  });
}