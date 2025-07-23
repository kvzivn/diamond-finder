import { authenticate } from '../shopify.server';
import type { DiamondType } from '../models/diamond.server';
import type { CaratRange } from './diamond-pricing.server';

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

export async function fetchThemeSettingsWithAuth(
  request: Request
): Promise<ThemeSettings | null> {
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
      console.error('[THEME SETTINGS] No active theme found');
      return null;
    }

    const themeId = activeTheme.node.id;

    // Now fetch the theme settings using GraphQL instead of REST to avoid admin.rest error
    const settingsResponse = await admin.graphql(
      `#graphql
        query getThemeAsset($themeId: ID!, $key: String!) {
          theme(id: $themeId) {
            asset(key: $key) {
              ... on OnlineStoreThemeFileBodyText {
                content
              }
            }
          }
        }`,
      {
        variables: {
          themeId,
          key: 'config/settings_data.json',
        },
      }
    );

    const settingsData = await settingsResponse.json();
    const settingsContent = JSON.parse(
      settingsData.data?.theme?.asset?.content || '{}'
    );

    // Extract diamond search block settings
    const blocks = settingsContent.current?.blocks || {};

    // Find the diamond search block
    for (const blockKey in blocks) {
      const block = blocks[blockKey];
      if (block.type === 'diamond_search' && block.settings) {
        console.log(
          '[THEME SETTINGS] Found diamond search block settings:',
          block.settings
        );
        return block.settings as ThemeSettings;
      }
    }

    console.log(
      '[THEME SETTINGS] No diamond search block found in theme settings'
    );
    return null;
  } catch (error) {
    console.error('[THEME SETTINGS] Error fetching theme settings:', error);
    return null;
  }
}

export function parseThemeSettingsToRanges(
  settings: ThemeSettings | null,
  type: DiamondType
): CaratRange[] {
  const defaultRanges =
    type === 'natural'
      ? [
          { min: 0, max: 0.5, multiplier: 1.0 },
          { min: 0.5, max: 0.7, multiplier: 1.0 },
          { min: 0.7, max: 1, multiplier: 1.0 },
          { min: 1, max: 1.1, multiplier: 1.0 },
          { min: 1.1, max: 1.5, multiplier: 1.0 },
          { min: 1.5, max: 2, multiplier: 1.0 },
          { min: 2, max: 3, multiplier: 1.0 },
          { min: 3, max: 5, multiplier: 1.0 },
          { min: 5, max: 150, multiplier: 1.0 },
        ]
      : [
          { min: 0, max: 0.5, multiplier: 1.0 },
          { min: 0.5, max: 0.7, multiplier: 1.0 },
          { min: 0.7, max: 1, multiplier: 1.0 },
          { min: 1, max: 1.1, multiplier: 1.0 },
          { min: 1.1, max: 1.5, multiplier: 1.0 },
          { min: 1.5, max: 2, multiplier: 1.0 },
          { min: 2, max: 3, multiplier: 1.0 },
          { min: 3, max: 5, multiplier: 1.0 },
          { min: 5, max: 150, multiplier: 1.0 },
        ];

  if (!settings) {
    console.log(
      '[THEME SETTINGS] No settings provided, using default ranges with 1.0 multipliers'
    );
    return defaultRanges;
  }

  const prefix = type === 'natural' ? 'natural_' : 'lab_';
  const keys = [
    `${prefix}0_0_5`,
    `${prefix}0_5_0_7`,
    `${prefix}0_7_1`,
    `${prefix}1_1_1`,
    `${prefix}1_1_1_5`,
    `${prefix}1_5_2`,
    `${prefix}2_3`,
    `${prefix}3_5`,
    `${prefix}5_150`,
  ];

  console.log(
    `[THEME SETTINGS] Parsing settings for ${type} diamonds:`,
    settings
  );

  return defaultRanges.map((range, index) => {
    const settingValue = settings[keys[index]];
    const parsedValue = parseFloat(settingValue || '1.0');

    // Use 1.0 if the value is not a valid number
    const multiplier = isNaN(parsedValue) ? 1.0 : parsedValue;

    console.log(
      `[THEME SETTINGS] Range ${index}: ${range.min}-${range.max} carat -> multiplier: ${multiplier} (from setting: ${settingValue})`
    );

    return {
      ...range,
      multiplier,
    };
  });
}
