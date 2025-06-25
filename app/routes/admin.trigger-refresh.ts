import { ActionFunctionArgs, json } from '@remix-run/node';
import { refreshAllDiamonds } from '../services/diamond-updater.server';

/**
 * Action to manually trigger a refresh of all diamonds in the database.
 * This now runs as a "fire-and-forget" background job to prevent proxy timeouts.
 * Monitor progress via `fly logs`.
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json(
      { message: 'Method not allowed. Please use POST.' },
      { status: 405 }
    );
  }

  console.log('Admin: Manual database refresh triggered in the background.');

  // Fire-and-forget: Start the process but don't await it
  refreshAllDiamonds(true)
    .then((results) => {
      console.log(
        '🎉 BACKGROUND REFRESH COMPLETED: All diamonds refresh process finished successfully.',
        results
      );
    })
    .catch((error) => {
      console.error(
        '❌ BACKGROUND REFRESH FAILED: All diamonds refresh process failed.',
        error
      );
    });

  // Return immediate response to prevent proxy timeouts
  return json({
    success: true,
    message:
      'Diamond database refresh triggered successfully in the background. Monitor progress via `fly logs`.',
    note: 'This process will continue running on the server. Check logs for completion status.',
  });
}

// Optional: You can add a simple loader to render a button for easier manual triggering in browser
// import type { LoaderFunctionArgs } from '@remix-run/node';
// export async function loader({}: LoaderFunctionArgs) {
//   return new Response(
//     '<form method="post"><button type="submit">Refresh All Diamonds in Database</button></form>',
//     { headers: { "Content-Type": "text/html" } }
//   );
// }
