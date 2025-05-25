import { json, LoaderFunctionArgs } from '@remix-run/node';
import type { DiamondType } from '../models/diamond.server';
import { getCachedDiamonds } from '../services/diamond-cache.server';
import { refreshDiamondCacheByType } from '../services/diamond-updater.server';

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

export async function loader({ params, request }: LoaderFunctionArgs) {
  const type = params.type as DiamondType;

  if (type !== 'natural' && type !== 'lab') {
    return json({ error: 'Invalid diamond type specified.' }, { status: 400 });
  }

  const url = new URL(request.url);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  let limit = parseInt(url.searchParams.get('limit') || String(DEFAULT_LIMIT), 10);

  if (isNaN(offset) || offset < 0) {
    return json({ error: 'Invalid offset parameter.' }, { status: 400 });
  }
  if (isNaN(limit) || limit <= 0) {
    limit = DEFAULT_LIMIT;
  }
  if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  let diamonds = getCachedDiamonds(type);

  if (!diamonds) {
    console.log(`API Route: Cache miss for ${type}. Triggering background refresh.`);
    // Trigger refresh but don't await it for this request to keep it responsive
    refreshDiamondCacheByType(type).catch((err: Error) => {
      console.error(`API Route: Background refresh for ${type} failed:`, err.message);
    });
    diamonds = []; // Return empty array while cache is populated in background
  }

  const paginatedDiamonds = diamonds.slice(offset, offset + limit);
  const totalCount = diamonds.length;

  return json({
    data: paginatedDiamonds,
    totalCount,
    offset,
    limit,
    type,
  });
}