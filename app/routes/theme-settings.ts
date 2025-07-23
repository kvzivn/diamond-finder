import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

interface ThemeSettings {
  natural_0_0_5?: string;
  natural_0_5_0_7?: string;
  natural_0_7_1?: string;
  natural_1_1_1?: string;
  natural_1_1_1_5?: string;
  natural_1_5_2?: string;
  natural_2_3?: string;
  natural_3_5?: string;
  natural_5_150?: string;
  lab_0_0_5?: string;
  lab_0_5_0_7?: string;
  lab_0_7_1?: string;
  lab_1_1_1?: string;
  lab_1_1_1_5?: string;
  lab_1_5_2?: string;
  lab_2_3?: string;
  lab_3_5?: string;
  lab_5_150?: string;
  [key: string]: string | undefined;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  console.log(
    '[API THEME SETTINGS] App proxy request received from:',
    request.headers.get('referer')
  );

  try {
    // Use app proxy authentication instead of admin authentication
    const { session } = await authenticate.public.appProxy(request);
    console.log(
      '[API THEME SETTINGS] App proxy authentication successful, session:',
      !!session
    );

    if (!session) {
      console.error('[API THEME SETTINGS] No session available from app proxy');
      return json({ error: 'Unauthorized - no session' }, { status: 401 });
    }

    // For app proxy requests, we need to use the session to get admin context
    // The session contains the shop domain and access token
    const { shop, accessToken } = session;
    console.log(
      '[API THEME SETTINGS] Shop:',
      shop,
      'Has access token:',
      !!accessToken
    );

    if (!shop || !accessToken) {
      console.error(
        '[API THEME SETTINGS] Missing shop or access token in session'
      );
      return json({ error: 'Invalid session data' }, { status: 500 });
    }

    // Make direct GraphQL call using the session's access token
    const themesResponse = await fetch(
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: `
          query getActiveTheme {
            themes(first: 10) {
              edges {
                node {
                  id
                  name
                  role
                }
              }
            }
          }
        `,
        }),
      }
    );

    if (!themesResponse.ok) {
      console.error(
        '[API THEME SETTINGS] Themes GraphQL request failed:',
        themesResponse.status
      );
      return json({ error: 'Failed to fetch themes' }, { status: 500 });
    }

    const themesData = await themesResponse.json();
    console.log('[API THEME SETTINGS] Themes response:', themesData);

    const activeTheme = themesData.data?.themes?.edges?.find(
      (edge: any) => edge.node.role === 'main'
    );

    if (!activeTheme) {
      console.error('[API THEME SETTINGS] No active theme found');
      return json({ error: 'No active theme found' }, { status: 404 });
    }

    console.log('[API THEME SETTINGS] Active theme found:', activeTheme.node);
    const themeId = activeTheme.node.id;

    // Now fetch the theme settings using GraphQL
    const settingsResponse = await fetch(
      `https://${shop}/admin/api/2025-01/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Shopify-Access-Token': accessToken,
        },
        body: JSON.stringify({
          query: `
          query getThemeAsset($themeId: ID!, $key: String!) {
            theme(id: $themeId) {
              asset(key: $key) {
                ... on OnlineStoreThemeFileBodyText {
                  content
                }
              }
            }
          }
        `,
          variables: {
            themeId,
            key: 'config/settings_data.json',
          },
        }),
      }
    );

    if (!settingsResponse.ok) {
      console.error(
        '[API THEME SETTINGS] Settings GraphQL request failed:',
        settingsResponse.status
      );
      return json({ error: 'Failed to fetch theme settings' }, { status: 500 });
    }

    const settingsData = await settingsResponse.json();
    console.log('[API THEME SETTINGS] Settings response status:', settingsData);

    if (!settingsData.data?.theme?.asset?.content) {
      console.error('[API THEME SETTINGS] No theme asset content found');
      return json(
        { error: 'Failed to fetch theme settings - no content found' },
        { status: 500 }
      );
    }

    const settingsContent = JSON.parse(settingsData.data.theme.asset.content);
    console.log(
      '[API THEME SETTINGS] Parsed settings content keys:',
      Object.keys(settingsContent)
    );

    // Extract diamond search block settings
    const blocks = settingsContent.current?.blocks || {};
    console.log('[API THEME SETTINGS] Available blocks:', Object.keys(blocks));

    // Find the diamond search block
    for (const blockKey in blocks) {
      const block = blocks[blockKey];
      console.log(`[API THEME SETTINGS] Checking block ${blockKey}:`, {
        type: block.type,
        hasSettings: !!block.settings,
      });

      if (block.type === 'diamond_search' && block.settings) {
        console.log(
          '[API THEME SETTINGS] Found diamond search block settings:',
          block.settings
        );
        return json({ settings: block.settings as ThemeSettings });
      }
    }

    console.log(
      '[API THEME SETTINGS] No diamond search block found in theme settings'
    );
    return json(
      { error: 'No diamond search block found in theme settings' },
      { status: 404 }
    );
  } catch (error) {
    console.error('[API THEME SETTINGS] Error fetching theme settings:', error);
    return json(
      {
        error: 'Failed to fetch theme settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
