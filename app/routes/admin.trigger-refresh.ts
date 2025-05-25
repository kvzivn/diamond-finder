import { ActionFunctionArgs, json } from '@remix-run/node';
import { refreshAllDiamondCaches } from '../services/diamond-updater.server';

/**
 * Action to manually trigger a refresh of all diamond caches.
 * Call this via a POST request (e.g., from a form or curl) during development/admin tasks.
 * For production, a secure cron job endpoint is recommended.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ message: 'Method not allowed. Please use POST.' }, { status: 405 });
  }

  console.log('Admin: Manual cache refresh triggered.');
  try {
    // Using force = true to ensure it always refreshes when manually triggered
    const results = await refreshAllDiamondCaches(true);
    console.log('Admin: Manual cache refresh completed.', results);
    return json({ success: true, message: 'Diamond caches refresh triggered successfully.', results });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during cache refresh.';
    console.error('Admin: Manual cache refresh failed:', errorMessage);
    return json({ success: false, message: 'Failed to trigger diamond cache refresh.', error: errorMessage }, { status: 500 });
  }
}

// Optional: You can add a simple loader to render a button for easier manual triggering in browser
// import type { LoaderFunctionArgs } from '@remix-run/node';
// export async function loader({}: LoaderFunctionArgs) {
//   return new Response(
//     '<form method="post"><button type="submit">Refresh All Diamond Caches</button></form>',
//     { headers: { "Content-Type": "text/html" } }
//   );
// }