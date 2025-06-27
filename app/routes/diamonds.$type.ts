import { json, LoaderFunctionArgs } from '@remix-run/node';
import type { DiamondType } from '../models/diamond.server';
import { getDiamondsByType } from '../services/diamond-db.server';
// TEMPORARILY DISABLED: Auto fetching import
// import { refreshDiamondsByType } from '../services/diamond-updater.server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function loader({ params, request }: LoaderFunctionArgs) {
  const type = params.type as DiamondType;

  if (type !== 'natural' && type !== 'lab') {
    return json({ error: 'Invalid diamond type specified.' }, { status: 400 });
  }

  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  let limit = parseInt(
    url.searchParams.get('limit') || String(DEFAULT_LIMIT),
    10
  );

  if (isNaN(offset) || offset < 0) {
    return json({ error: 'Invalid offset parameter.' }, { status: 400 });
  }
  if (isNaN(limit) || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  try {
    const { data, totalCount } = await getDiamondsByType(type, offset, limit);

    // TEMPORARILY DISABLED: Auto fetching when no diamonds found
    // If no diamonds found, trigger a background refresh
    // if (totalCount === 0) {
    //   console.log(
    //     `API Route: No ${type} diamonds in database. Triggering background refresh.`
    //   );
    //   // Trigger refresh but don't await it for this request to keep it responsive
    //   refreshDiamondsByType(type).catch((err: Error) => {
    //     console.error(
    //       `API Route: Background refresh for ${type} failed:`,
    //       err.message
    //     );
    //   });
    // }

    return json({
      data,
      totalCount,
      offset,
      limit,
      type,
    });
  } catch (error) {
    console.error(`Error fetching ${type} diamonds:`, error);
    return json(
      { error: 'Failed to fetch diamonds. Please try again later.' },
      { status: 500 }
    );
  }
}
