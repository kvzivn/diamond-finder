import type { LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';

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
  console.log('[TEST THEME SETTINGS] Test endpoint called');

  try {
    // Use hardcoded values for testing - replace these with your actual shop details
    const shop = 'swedia1.myshopify.com';
    const accessToken =
      process.env.SHOPIFY_ACCESS_TOKEN || 'your-access-token-here';

    console.log('[TEST THEME SETTINGS] Using shop:', shop);
    console.log('[TEST THEME SETTINGS] Has access token:', !!accessToken);

    if (!accessToken || accessToken === 'your-access-token-here') {
      return json(
        {
          error:
            'Please set SHOPIFY_ACCESS_TOKEN environment variable for testing',
          note: 'This is a test endpoint - use /theme-settings for production',
        },
        { status: 500 }
      );
    }

    // Make direct GraphQL call using the access token
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
        '[TEST THEME SETTINGS] Themes GraphQL request failed:',
        themesResponse.status
      );
      const errorText = await themesResponse.text();
      return json(
        {
          error: 'Failed to fetch themes',
          details: `${themesResponse.status}: ${errorText}`,
        },
        { status: 500 }
      );
    }

    const themesData = await themesResponse.json();
    console.log('[TEST THEME SETTINGS] Themes response:', themesData);

    if (themesData.errors) {
      return json(
        {
          error: 'GraphQL errors in themes query',
          details: themesData.errors,
        },
        { status: 500 }
      );
    }

    const activeTheme = themesData.data?.themes?.edges?.find(
      (edge: any) => edge.node.role === 'main'
    );

    if (!activeTheme) {
      console.error('[TEST THEME SETTINGS] No active theme found');
      return json({ error: 'No active theme found' }, { status: 404 });
    }

    console.log('[TEST THEME SETTINGS] Active theme found:', activeTheme.node);
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
        '[TEST THEME SETTINGS] Settings GraphQL request failed:',
        settingsResponse.status
      );
      const errorText = await settingsResponse.text();
      return json(
        {
          error: 'Failed to fetch theme settings',
          details: `${settingsResponse.status}: ${errorText}`,
        },
        { status: 500 }
      );
    }

    const settingsData = await settingsResponse.json();
    console.log('[TEST THEME SETTINGS] Settings response:', settingsData);

    if (settingsData.errors) {
      return json(
        {
          error: 'GraphQL errors in settings query',
          details: settingsData.errors,
        },
        { status: 500 }
      );
    }

    if (!settingsData.data?.theme?.asset?.content) {
      console.error('[TEST THEME SETTINGS] No theme asset content found');
      return json(
        { error: 'Failed to fetch theme settings - no content found' },
        { status: 500 }
      );
    }

    const settingsContent = JSON.parse(settingsData.data.theme.asset.content);
    console.log(
      '[TEST THEME SETTINGS] Parsed settings content keys:',
      Object.keys(settingsContent)
    );

    // Extract diamond search block settings
    const blocks = settingsContent.current?.blocks || {};
    console.log('[TEST THEME SETTINGS] Available blocks:', Object.keys(blocks));

    // Find the diamond search block
    for (const blockKey in blocks) {
      const block = blocks[blockKey];
      console.log(`[TEST THEME SETTINGS] Checking block ${blockKey}:`, {
        type: block.type,
        hasSettings: !!block.settings,
      });

      if (block.type === 'diamond_search' && block.settings) {
        console.log(
          '[TEST THEME SETTINGS] Found diamond search block settings:',
          block.settings
        );
        return json({
          success: true,
          settings: block.settings as ThemeSettings,
          note: 'This is a test endpoint - use /theme-settings for production',
        });
      }
    }

    console.log(
      '[TEST THEME SETTINGS] No diamond search block found in theme settings'
    );
    return json(
      {
        error: 'No diamond search block found in theme settings',
        blocksFound: Object.keys(blocks),
      },
      { status: 404 }
    );
  } catch (error) {
    console.error(
      '[TEST THEME SETTINGS] Error fetching theme settings:',
      error
    );
    return json(
      {
        error: 'Failed to fetch theme settings',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
};
