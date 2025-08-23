import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';
import { getMarkupIntervals } from '../services/markup-intervals.server';

interface MarkupIntervalsResponse {
  natural: Array<{
    min: number;
    max: number;
    multiplier: number;
  }>;
  lab: Array<{
    min: number;
    max: number;
    multiplier: number;
  }>;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(
    '[API MARKUP INTERVALS] Request received from:',
    request.headers.get('referer')
  );

  try {
    // Use app proxy authentication for theme extension requests
    const { session } = await authenticate.public.appProxy(request);
    console.log(
      '[API MARKUP INTERVALS] App proxy authentication successful, session:',
      !!session
    );

    if (!session) {
      console.error('[API MARKUP INTERVALS] No session available from app proxy');
      return json({ error: 'Unauthorized - no session' }, { status: 401 });
    }

    // Fetch markup intervals for both diamond types
    const [naturalIntervals, labIntervals] = await Promise.all([
      getMarkupIntervals('natural'),
      getMarkupIntervals('lab'),
    ]);

    console.log(
      `[API MARKUP INTERVALS] Loaded ${naturalIntervals.length} natural and ${labIntervals.length} lab intervals`
    );

    const response: MarkupIntervalsResponse = {
      natural: naturalIntervals,
      lab: labIntervals,
    };

    return json(response, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('[API MARKUP INTERVALS] Error fetching markup intervals:', error);
    
    // Return fallback intervals
    const fallbackIntervals = Array.from({ length: 50 }, (_, i) => ({
      min: i * 0.1,
      max: i === 49 ? 5.0 : (i * 0.1) + 0.09,
      multiplier: 1.0,
    }));

    return json(
      {
        natural: fallbackIntervals,
        lab: fallbackIntervals,
        fallback: true,
        error: 'Database unavailable - using fallback intervals',
      },
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate', // No caching
          'Pragma': 'no-cache',
          'Expires': '0',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      }
    );
  }
};