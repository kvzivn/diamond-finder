import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

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
  try {
    const { admin } = await authenticate.admin(request);
    
    // First, get the active theme
    const themesResponse = await admin.graphql(
      `#graphql
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
        }`
    );
    
    const themesData = await themesResponse.json();
    const activeTheme = themesData.data?.themes?.edges?.find(
      (edge: any) => edge.node.role === 'main'
    );
    
    if (!activeTheme) {
      return json({ error: 'No active theme found' }, { status: 404 });
    }
    
    const themeId = activeTheme.node.id;
    
    // Now fetch the theme settings
    const settingsResponse = await admin.rest.get({
      path: `themes/${themeId.split('/').pop()}/assets.json`,
      query: { 'asset[key]': 'config/settings_data.json' }
    });
    
    const settingsData = await settingsResponse.json();
    const settingsContent = JSON.parse(settingsData.asset.value);
    
    // Extract diamond search block settings
    const blocks = settingsContent.current?.blocks || {};
    
    // Find the diamond search block
    for (const blockKey in blocks) {
      const block = blocks[blockKey];
      if (block.type === 'diamond_search' && block.settings) {
        return json({ settings: block.settings as ThemeSettings });
      }
    }
    
    return json({ error: 'No diamond search block found in theme settings' }, { status: 404 });
  } catch (error) {
    console.error('[API THEME SETTINGS] Error fetching theme settings:', error);
    return json({ error: 'Failed to fetch theme settings' }, { status: 500 });
  }
};