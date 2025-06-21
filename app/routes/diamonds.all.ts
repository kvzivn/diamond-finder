import { json, LoaderFunctionArgs } from '@remix-run/node';
import { getCachedDiamonds } from '../services/diamond-cache.server';
import { refreshDiamondCacheByType } from '../services/diamond-updater.server';
import type { Diamond } from '../models/diamond.server'; // Assuming Diamond model exists

function applyFilters(
  diamonds: Diamond[],
  filters: {
    shape?: string;
    minPrice?: number;
    maxPrice?: number;
    minPriceSek?: number;
    maxPriceSek?: number;
    minCarat?: number;
    maxCarat?: number;
    minColour?: string;
    maxColour?: string;
    minClarity?: string;
    maxClarity?: string;
    minCutGrade?: string;
    maxCutGrade?: string;
    type?: string;
    gradingLab?: string;
    minFluorescence?: string;
    maxFluorescence?: string;
    minPolish?: string;
    maxPolish?: string;
    minSymmetry?: string;
    maxSymmetry?: string;
    minTable?: number;
    maxTable?: number;
    minRatio?: number;
    maxRatio?: number;
    fancyColours?: string;
    minFancyIntensity?: string;
    maxFancyIntensity?: string;
  }
): Diamond[] {
  let filtered = [...diamonds];

  // Shape filter (using 'cut' property for shape)
  if (filters.shape) {
    filtered = filtered.filter((d) => {
      const diamondShape = d.cut ? d.cut.toUpperCase() : '';
      return diamondShape === filters.shape!.toUpperCase();
    });
  }

  // SEK Price filters (prioritize SEK over USD)
  if (filters.minPriceSek !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.totalPriceSek !== null &&
        d.totalPriceSek !== undefined &&
        d.totalPriceSek >= filters.minPriceSek!
    );
  } else if (filters.minPrice !== undefined) {
    // Fallback to USD price if SEK not available
    filtered = filtered.filter(
      (d) =>
        d.totalPrice !== null &&
        d.totalPrice !== undefined &&
        d.totalPrice >= filters.minPrice!
    );
  }

  if (filters.maxPriceSek !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.totalPriceSek !== null &&
        d.totalPriceSek !== undefined &&
        d.totalPriceSek <= filters.maxPriceSek!
    );
  } else if (filters.maxPrice !== undefined) {
    // Fallback to USD price if SEK not available
    filtered = filtered.filter(
      (d) =>
        d.totalPrice !== null &&
        d.totalPrice !== undefined &&
        d.totalPrice <= filters.maxPrice!
    );
  }

  // Carat filters
  if (filters.minCarat !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.carat !== null &&
        d.carat !== undefined &&
        d.carat >= filters.minCarat!
    );
  }
  if (filters.maxCarat !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.carat !== null &&
        d.carat !== undefined &&
        d.carat <= filters.maxCarat!
    );
  }

  // Colour filters
  if (filters.minColour || filters.maxColour) {
    const colourLabels = ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'];

    filtered = filtered.filter((d) => {
      const diamondColour = d.color ? d.color.trim() : '';

      // Find the index of the diamond's colour in our scale
      const diamondColourIndex = colourLabels.findIndex(
        (label) => label.toLowerCase() === diamondColour.toLowerCase()
      );

      // If the diamond's colour is not in our defined scale, exclude it
      if (diamondColourIndex === -1) {
        return false;
      }

      let withinRange = true;

      // Check minimum colour (lower quality/higher index) - inclusive
      if (filters.minColour) {
        const minIndex = colourLabels.findIndex(
          (label) => label.toLowerCase() === filters.minColour!.toLowerCase()
        );
        if (minIndex !== -1 && diamondColourIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum colour (higher quality/lower index) - exclusive
      if (filters.maxColour) {
        const maxIndex = colourLabels.findIndex(
          (label) => label.toLowerCase() === filters.maxColour!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondColourIndex >= maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  // Fancy colour filters
  if (
    filters.fancyColours ||
    filters.minFancyIntensity ||
    filters.maxFancyIntensity
  ) {
    const fancyColourList = filters.fancyColours
      ? filters.fancyColours.split(',').map((c) => c.toLowerCase())
      : [];
    const fancyIntensityLabels = [
      'Fancy Deep',
      'Fancy',
      'Fancy Intense',
      'Fancy Dark',
      'Fancy Light',
      'Light',
      'Very Light',
      'Faint',
    ];

    filtered = filtered.filter((d) => {
      const diamondColour = d.color ? d.color.trim() : '';

      // Check if it's a fancy colored diamond
      const isFancyColored =
        diamondColour.toLowerCase().includes('fancy') ||
        diamondColour.toLowerCase().includes('light') ||
        diamondColour.toLowerCase().includes('faint');

      if (!isFancyColored) {
        return false;
      }

      // Check fancy color match
      if (fancyColourList.length > 0) {
        let colorMatches = false;

        for (const fancyColor of fancyColourList) {
          if (fancyColor === 'other') {
            // For "other", match any fancy color not in the main list
            const mainColors = [
              'yellow',
              'pink',
              'blue',
              'red',
              'green',
              'purple',
              'orange',
              'violet',
              'gray',
              'black',
              'brown',
              'cognac',
              'white',
              's-and-p',
            ];
            const hasMainColor = mainColors.some((color) =>
              diamondColour.toLowerCase().includes(color.replace('-', ' '))
            );
            if (!hasMainColor) {
              colorMatches = true;
              break;
            }
          } else if (fancyColor === 's-and-p') {
            // Special case for S & P (Salt and Pepper)
            if (
              diamondColour.toLowerCase().includes('salt') ||
              diamondColour.toLowerCase().includes('pepper')
            ) {
              colorMatches = true;
              break;
            }
          } else {
            // Check if the diamond color contains the selected fancy color
            if (diamondColour.toLowerCase().includes(fancyColor)) {
              colorMatches = true;
              break;
            }
          }
        }

        if (!colorMatches) {
          return false;
        }
      }

      // Check intensity range
      if (filters.minFancyIntensity || filters.maxFancyIntensity) {
        // Extract intensity from diamond color
        let diamondIntensity = '';
        for (const intensity of fancyIntensityLabels) {
          if (diamondColour.includes(intensity)) {
            diamondIntensity = intensity;
            break;
          }
        }

        if (!diamondIntensity) {
          return false;
        }

        const diamondIntensityIndex = fancyIntensityLabels.findIndex(
          (label) => label === diamondIntensity
        );

        if (diamondIntensityIndex === -1) {
          return false;
        }

        // Check minimum intensity
        if (filters.minFancyIntensity) {
          const minIndex = fancyIntensityLabels.findIndex(
            (label) => label === filters.minFancyIntensity
          );
          if (minIndex !== -1 && diamondIntensityIndex < minIndex) {
            return false;
          }
        }

        // Check maximum intensity
        if (filters.maxFancyIntensity) {
          const maxIndex = fancyIntensityLabels.findIndex(
            (label) => label === filters.maxFancyIntensity
          );
          if (maxIndex !== -1 && diamondIntensityIndex > maxIndex) {
            return false;
          }
        }
      }

      return true;
    });
  }

  // Clarity filters
  if (filters.minClarity || filters.maxClarity) {
    const clarityLabels = [
      'SI2',
      'SI1',
      'VS2',
      'VS1',
      'VVS2',
      'VVS1',
      'IF',
      'FL',
    ];

    filtered = filtered.filter((d) => {
      const diamondClarity = d.clarity ? d.clarity.trim() : '';

      // Find the index of the diamond's clarity in our scale
      const diamondClarityIndex = clarityLabels.findIndex(
        (label) => label.toLowerCase() === diamondClarity.toLowerCase()
      );

      // If the diamond's clarity is not in our defined scale, exclude it
      if (diamondClarityIndex === -1) {
        return false;
      }

      let withinRange = true;

      // Check minimum clarity (lower quality/lower index)
      if (filters.minClarity) {
        const minIndex = clarityLabels.findIndex(
          (label) => label.toLowerCase() === filters.minClarity!.toLowerCase()
        );
        if (minIndex !== -1 && diamondClarityIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum clarity (higher quality/higher index)
      if (filters.maxClarity) {
        const maxIndex = clarityLabels.findIndex(
          (label) => label.toLowerCase() === filters.maxClarity!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondClarityIndex > maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  // Cut Grade filters
  if (filters.minCutGrade || filters.maxCutGrade) {
    const cutGradeLabels = ['Good', 'Very Good', 'Excellent'];

    filtered = filtered.filter((d) => {
      const diamondCutGrade = d.cutGrade ? d.cutGrade.trim() : '';

      // Find the index of the diamond's cut grade in our scale
      const diamondCutGradeIndex = cutGradeLabels.findIndex(
        (label) => label.toLowerCase() === diamondCutGrade.toLowerCase()
      );

      // If the diamond's cut grade is not in our defined scale, exclude it
      if (diamondCutGradeIndex === -1) {
        return false;
      }

      let withinRange = true;

      // Check minimum cut grade (lower quality/lower index)
      if (filters.minCutGrade) {
        const minIndex = cutGradeLabels.findIndex(
          (label) => label.toLowerCase() === filters.minCutGrade!.toLowerCase()
        );
        if (minIndex !== -1 && diamondCutGradeIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum cut grade (higher quality/higher index)
      if (filters.maxCutGrade) {
        const maxIndex = cutGradeLabels.findIndex(
          (label) => label.toLowerCase() === filters.maxCutGrade!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondCutGradeIndex > maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  // Polish filters
  if (filters.minPolish || filters.maxPolish) {
    const polishLabels = ['Good', 'Very Good', 'Excellent'];

    filtered = filtered.filter((d) => {
      const diamondPolish = d.polish ? d.polish.trim() : '';

      // Find the index of the diamond's polish in our scale
      const diamondPolishIndex = polishLabels.findIndex(
        (label) => label.toLowerCase() === diamondPolish.toLowerCase()
      );

      // If the diamond's polish is not in our defined scale, exclude it
      if (diamondPolishIndex === -1) {
        return false;
      }

      let withinRange = true;

      // Check minimum polish (lower quality/lower index)
      if (filters.minPolish) {
        const minIndex = polishLabels.findIndex(
          (label) => label.toLowerCase() === filters.minPolish!.toLowerCase()
        );
        if (minIndex !== -1 && diamondPolishIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum polish (higher quality/higher index)
      if (filters.maxPolish) {
        const maxIndex = polishLabels.findIndex(
          (label) => label.toLowerCase() === filters.maxPolish!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondPolishIndex > maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  // Symmetry filters
  if (filters.minSymmetry || filters.maxSymmetry) {
    const symmetryLabels = ['Good', 'Very Good', 'Excellent'];

    filtered = filtered.filter((d) => {
      const diamondSymmetry = d.symmetry ? d.symmetry.trim() : '';

      // Find the index of the diamond's symmetry in our scale
      const diamondSymmetryIndex = symmetryLabels.findIndex(
        (label) => label.toLowerCase() === diamondSymmetry.toLowerCase()
      );

      // If the diamond's symmetry is not in our defined scale, exclude it
      if (diamondSymmetryIndex === -1) {
        return false;
      }

      let withinRange = true;

      // Check minimum symmetry (lower quality/lower index)
      if (filters.minSymmetry) {
        const minIndex = symmetryLabels.findIndex(
          (label) => label.toLowerCase() === filters.minSymmetry!.toLowerCase()
        );
        if (minIndex !== -1 && diamondSymmetryIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum symmetry (higher quality/higher index)
      if (filters.maxSymmetry) {
        const maxIndex = symmetryLabels.findIndex(
          (label) => label.toLowerCase() === filters.maxSymmetry!.toLowerCase()
        );
        if (maxIndex !== -1 && diamondSymmetryIndex > maxIndex) {
          withinRange = false;
        }
      }

      return withinRange;
    });
  }

  // Table filters
  if (filters.minTable !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.tablePercent !== null &&
        d.tablePercent !== undefined &&
        d.tablePercent >= filters.minTable!
    );
  }
  if (filters.maxTable !== undefined) {
    filtered = filtered.filter(
      (d) =>
        d.tablePercent !== null &&
        d.tablePercent !== undefined &&
        d.tablePercent <= filters.maxTable!
    );
  }

  // Ratio filters
  if (filters.minRatio !== undefined) {
    filtered = filtered.filter((d) => {
      if (
        d.measurementsLength &&
        d.measurementsWidth &&
        d.measurementsWidth > 0
      ) {
        const ratio = d.measurementsLength / d.measurementsWidth;
        return ratio >= filters.minRatio!;
      }
      return false;
    });
  }
  if (filters.maxRatio !== undefined) {
    filtered = filtered.filter((d) => {
      if (
        d.measurementsLength &&
        d.measurementsWidth &&
        d.measurementsWidth > 0
      ) {
        const ratio = d.measurementsLength / d.measurementsWidth;
        return ratio <= filters.maxRatio!;
      }
      return false;
    });
  }

  // Grading Lab filter
  if (filters.gradingLab) {
    if (filters.gradingLab === 'NONE') {
      // If 'NONE' is passed, filter out all diamonds
      filtered = [];
    } else {
      const allowedLabs = filters.gradingLab
        .split(',')
        .map((lab) => lab.trim().toUpperCase());
      filtered = filtered.filter((d) => {
        const diamondLab = d.gradingLab ? d.gradingLab.toUpperCase() : '';
        return allowedLabs.includes(diamondLab);
      });
    }
  }

  // Fluorescence filter
  if (filters.minFluorescence || filters.maxFluorescence) {
    const fluorescenceLabels = [
      'Very Strong',
      'Strong',
      'Medium',
      'Faint',
      'None',
    ];

    filtered = filtered.filter((d) => {
      const diamondFluorescence = d.fluorescenceIntensity
        ? d.fluorescenceIntensity.trim()
        : '';

      // Find the index of the diamond's fluorescence in our scale
      const diamondFluorescenceIndex = fluorescenceLabels.findIndex(
        (label) => label.toLowerCase() === diamondFluorescence.toLowerCase()
      );

      // If the diamond's fluorescence is not in our defined scale, exclude it
      if (diamondFluorescenceIndex === -1) return false;

      let withinRange = true;

      // Check minimum fluorescence
      if (filters.minFluorescence) {
        const minIndex = fluorescenceLabels.findIndex(
          (label) =>
            label.toLowerCase() === filters.minFluorescence!.toLowerCase()
        );
        if (minIndex !== -1 && diamondFluorescenceIndex < minIndex) {
          withinRange = false;
        }
      }

      // Check maximum fluorescence
      if (filters.maxFluorescence) {
        const maxIndex = fluorescenceLabels.findIndex(
          (label) =>
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
  console.log('TEST_VAR from .env:', process.env.TEST_VAR);
  console.log(
    'IDEX_API_KEY from .env:',
    process.env.IDEX_API_KEY ? 'Loaded' : 'NOT LOADED'
  );
  console.log(
    'IDEX_API_SECRET from .env:',
    process.env.IDEX_API_SECRET ? 'Loaded' : 'NOT LOADED'
  );
  // No explicit authentication call here; relying on App Proxy

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '24'); // Changed default to 24 to match frontend

  // Extract filter parameters
  const filters = {
    shape: url.searchParams.get('shape') || undefined,
    minPrice: url.searchParams.get('minPrice')
      ? parseFloat(url.searchParams.get('minPrice')!)
      : undefined,
    maxPrice: url.searchParams.get('maxPrice')
      ? parseFloat(url.searchParams.get('maxPrice')!)
      : undefined,
    minPriceSek: url.searchParams.get('minPriceSek')
      ? parseFloat(url.searchParams.get('minPriceSek')!)
      : undefined,
    maxPriceSek: url.searchParams.get('maxPriceSek')
      ? parseFloat(url.searchParams.get('maxPriceSek')!)
      : undefined,
    minCarat: url.searchParams.get('minCarat')
      ? parseFloat(url.searchParams.get('minCarat')!)
      : undefined,
    maxCarat: url.searchParams.get('maxCarat')
      ? parseFloat(url.searchParams.get('maxCarat')!)
      : undefined,
    minColour: url.searchParams.get('minColour') || undefined,
    maxColour: url.searchParams.get('maxColour') || undefined,
    minClarity: url.searchParams.get('minClarity') || undefined,
    maxClarity: url.searchParams.get('maxClarity') || undefined,
    minCutGrade: url.searchParams.get('minCutGrade') || undefined,
    maxCutGrade: url.searchParams.get('maxCutGrade') || undefined,
    type: url.searchParams.get('type') || undefined,
    gradingLab: url.searchParams.get('gradingLab') || undefined,
    minFluorescence: url.searchParams.get('minFluorescence') || undefined,
    maxFluorescence: url.searchParams.get('maxFluorescence') || undefined,
    minPolish: url.searchParams.get('minPolish') || undefined,
    maxPolish: url.searchParams.get('maxPolish') || undefined,
    minSymmetry: url.searchParams.get('minSymmetry') || undefined,
    maxSymmetry: url.searchParams.get('maxSymmetry') || undefined,
    minTable: url.searchParams.get('minTable')
      ? parseFloat(url.searchParams.get('minTable')!)
      : undefined,
    maxTable: url.searchParams.get('maxTable')
      ? parseFloat(url.searchParams.get('maxTable')!)
      : undefined,
    minRatio: url.searchParams.get('minRatio')
      ? parseFloat(url.searchParams.get('minRatio')!)
      : undefined,
    maxRatio: url.searchParams.get('maxRatio')
      ? parseFloat(url.searchParams.get('maxRatio')!)
      : undefined,
    fancyColours: url.searchParams.get('fancyColours') || undefined,
    minFancyIntensity: url.searchParams.get('minFancyIntensity') || undefined,
    maxFancyIntensity: url.searchParams.get('maxFancyIntensity') || undefined,
  };

  console.log(
    'API Route (/all): Received filters:',
    JSON.stringify(filters, null, 2)
  );

  let naturalDiamonds: Diamond[] = getCachedDiamonds('natural') || [];
  let labDiamonds: Diamond[] = getCachedDiamonds('lab') || [];

  // It's possible the cache was populated between the getCachedDiamonds call and this check,
  // but for simplicity, we check the initially retrieved values.
  // refreshDiamondCacheByType is designed to be idempotent and not run if a refresh is already in progress.
  if (naturalDiamonds.length === 0) {
    // Check if initially empty
    const currentNaturalDiamonds = getCachedDiamonds('natural'); // Re-check, might have been populated
    if (!currentNaturalDiamonds || currentNaturalDiamonds.length === 0) {
      console.log(
        'API Route (/all): Cache potentially empty for natural. Triggering background refresh.'
      );
      refreshDiamondCacheByType('natural').catch((err: Error) => {
        console.error(
          'API Route (/all): Background refresh for natural failed:',
          err.message
        );
      });
    } else {
      naturalDiamonds = currentNaturalDiamonds; // Use the re-checked data
    }
  }

  if (labDiamonds.length === 0) {
    // Check if initially empty
    const currentLabDiamonds = getCachedDiamonds('lab'); // Re-check
    if (!currentLabDiamonds || currentLabDiamonds.length === 0) {
      console.log(
        'API Route (/all): Cache potentially empty for lab. Triggering background refresh.'
      );
      refreshDiamondCacheByType('lab').catch((err: Error) => {
        console.error(
          'API Route (/all): Background refresh for lab failed:',
          err.message
        );
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

  console.log(
    `API Route (/all): Applied filters. Total diamonds: ${allDiamonds.length}, Filtered: ${filteredDiamonds.length}`
  );

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
