import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { getFilteredDiamonds } from '../services/diamond-db.server';
// TEMPORARILY DISABLED: Auto fetching imports
// import { refreshDiamondsByType } from '../services/diamond-updater.server';
// import type { DiamondType } from '../models/diamond.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  // Parse pagination parameters
  const page = parseInt(url.searchParams.get('page') || '1', 10);
  const limit = parseInt(url.searchParams.get('limit') || '100', 10);
  const offset = (page - 1) * limit;

  // Parse all query parameters
  const filters = {
    type: url.searchParams.get('type') || undefined,
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
    offset: offset,
    limit: limit,
  };

  // Validate pagination parameters
  if (isNaN(page) || page < 1) {
    return json({ error: 'Invalid page parameter.' }, { status: 400 });
  }
  if (isNaN(limit) || limit <= 0) {
    return json({ error: 'Invalid limit parameter.' }, { status: 400 });
  }
  if (limit > 1000) {
    return json({ error: 'Limit cannot exceed 1000.' }, { status: 400 });
  }

  try {
    // Get filtered diamonds from database
    const { data, totalCount } = await getFilteredDiamonds(filters);

    // TEMPORARILY DISABLED: Auto fetching when no diamonds found
    // If no diamonds found and a specific type is requested, trigger a background refresh
    // if (
    //   data.length === 0 &&
    //   filters.type &&
    //   (filters.type === 'natural' || filters.type === 'lab')
    // ) {
    //   console.log(
    //     `No ${filters.type} diamonds found. Triggering background refresh.`
    //   );
    //   // Trigger refresh but don't await it
    //   refreshDiamondsByType(filters.type as DiamondType).catch((err: Error) => {
    //     console.error(
    //       `Background refresh for ${filters.type} failed:`,
    //       err.message
    //     );
    //   });
    // }

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);

    return json({
      diamonds: data,
      totalCount,
      totalDiamonds: totalCount,
      currentPage: page,
      totalPages,
      offset: filters.offset,
      limit: limit,
      totalNaturalDiamonds: totalCount, // For now, using totalCount as placeholder
      totalLabDiamonds: totalCount, // For now, using totalCount as placeholder
      filters: {
        ...filters,
        offset: undefined,
        limit: undefined,
      },
    });
  } catch (error) {
    console.error('Error fetching diamonds:', error);
    return json(
      { error: 'Failed to fetch diamonds. Please try again later.' },
      { status: 500 }
    );
  }
}
