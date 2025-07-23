import type { ActionFunctionArgs} from '@remix-run/node';
import { json } from '@remix-run/node';
import { refreshDiamondsByType } from '../services/diamond-updater.server';
import type { DiamondType } from '../models/diamond.server';

/**
 * Validates the API key from the Authorization header
 */
function validateApiKey(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const expectedKey = process.env.REFRESH_API_KEY;
  
  if (!expectedKey) {
    console.error('[AUTH] REFRESH_API_KEY environment variable not set');
    return false;
  }
  
  return token === expectedKey;
}

/**
 * Action to manually trigger a refresh of a specific diamond type.
 * This runs as a "fire-and-forget" background job to prevent proxy timeouts.
 * Monitor progress via `fly logs`.
 *
 * Usage:
 * - POST /admin/trigger-refresh-partial with form data: type=natural
 * - POST /admin/trigger-refresh-partial with form data: type=lab
 */
export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json(
      { message: 'Method not allowed. Please use POST.' },
      { status: 405 }
    );
  }

  // Validate API key
  if (!validateApiKey(request)) {
    return json(
      { message: 'Unauthorized. Valid API key required.' },
      { status: 401 }
    );
  }

  const formData = await request.formData();
  const type = formData.get('type') as DiamondType;

  if (!type || (type !== 'natural' && type !== 'lab')) {
    return json(
      {
        message:
          'Invalid diamond type. Use "natural" or "lab" in the form data.',
      },
      { status: 400 }
    );
  }

  console.log(
    `Admin: Manual ${type} diamond refresh triggered in the background.`
  );

  // Fire-and-forget: Start the process but don't await it
  refreshDiamondsByType(type, true)
    .then((result) => {
      console.log(
        `🎉 BACKGROUND REFRESH COMPLETED: ${type} diamond refresh process finished.`,
        result
      );
    })
    .catch((error) => {
      console.error(
        `❌ BACKGROUND REFRESH FAILED: ${type} diamond refresh process failed.`,
        error
      );
    });

  return json({
    success: true,
    message: `${type} diamond database refresh triggered successfully in the background. Monitor progress via 'fly logs'.`,
    note: 'This process will continue running on the server. Check logs for completion status.',
  });
}
