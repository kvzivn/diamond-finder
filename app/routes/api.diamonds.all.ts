import { json, LoaderFunctionArgs } from '@remix-run/node';
import { getCachedDiamonds } from '../services/diamond-cache.server';
import { refreshDiamondCacheByType } from '../services/diamond-updater.server';
import type { Diamond } from '../models/diamond.server'; // Assuming Diamond model exists

export async function loader({ request }: LoaderFunctionArgs) {
  console.log("TEST_VAR from .env:", process.env.TEST_VAR);
  console.log("IDEX_API_KEY from .env:", process.env.IDEX_API_KEY ? "Loaded" : "NOT LOADED");
  console.log("IDEX_API_SECRET from .env:", process.env.IDEX_API_SECRET ? "Loaded" : "NOT LOADED");
  // No explicit authentication call here; relying on App Proxy

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = parseInt(url.searchParams.get("limit") || "100"); // Default to 100 items per page

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

  const allDiamonds = [...naturalDiamonds, ...labDiamonds];

  const totalDiamonds = allDiamonds.length;
  const totalNaturalDiamonds = naturalDiamonds.length;
  const totalLabDiamonds = labDiamonds.length;

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;
  const paginatedDiamonds = allDiamonds.slice(startIndex, endIndex);

  return json({
    diamonds: paginatedDiamonds,
    totalDiamonds,
    totalNaturalDiamonds,
    totalLabDiamonds,
    currentPage: page,
    totalPages: Math.ceil(totalDiamonds / limit),
    limit,
  });
}