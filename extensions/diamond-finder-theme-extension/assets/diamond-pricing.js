// Diamond Pricing Module - Client-side markup application
if (typeof window !== 'undefined') {
  window.DiamondPricing = {
    // Cache for theme settings to avoid repeated processing
    _themeSettings: null,

    // Default markup ranges if theme settings can't be fetched
    _defaultRanges: {
      natural: [
        { min: 0, max: 0.5, multiplier: 1.0 },
        { min: 0.5, max: 0.7, multiplier: 1.0 },
        { min: 0.7, max: 1, multiplier: 1.0 },
        { min: 1, max: 1.1, multiplier: 1.0 },
        { min: 1.1, max: 1.5, multiplier: 1.0 },
        { min: 1.5, max: 2, multiplier: 1.0 },
        { min: 2, max: 3, multiplier: 1.0 },
        { min: 3, max: 5, multiplier: 1.0 },
        { min: 5, max: 150, multiplier: 1.0 },
      ],
      lab: [
        { min: 0, max: 0.5, multiplier: 1.0 },
        { min: 0.5, max: 0.7, multiplier: 1.0 },
        { min: 0.7, max: 1, multiplier: 1.0 },
        { min: 1, max: 1.1, multiplier: 1.0 },
        { min: 1.1, max: 1.5, multiplier: 1.0 },
        { min: 1.5, max: 2, multiplier: 1.0 },
        { min: 2, max: 3, multiplier: 1.0 },
        { min: 3, max: 5, multiplier: 1.0 },
        { min: 5, max: 150, multiplier: 1.0 },
      ],
    },

    // Clear cache (useful for testing theme settings changes)
    clearCache() {
      console.log('[DIAMOND PRICING] Clearing theme settings cache');
      this._themeSettings = null;
    },

    // Fetch theme settings from the directly passed settings
    async fetchThemeSettings() {
      console.log('[DIAMOND PRICING] fetchThemeSettings called');

      if (this._themeSettings) {
        console.log(
          '[DIAMOND PRICING] Using cached theme settings:',
          this._themeSettings
        );
        return this._themeSettings;
      }

      console.log(
        '[DIAMOND PRICING] Getting theme settings from window.DiamondThemeSettings'
      );
      this._themeSettings = this._getSettingsFromWindow();
      return this._themeSettings;
    },

    // Internal method to get settings from window object
    _getSettingsFromWindow() {
      try {
        console.log(
          '[DIAMOND PRICING] Getting settings from window.DiamondThemeSettings'
        );

        if (!window.DiamondThemeSettings) {
          console.warn(
            '[DIAMOND PRICING] window.DiamondThemeSettings not found, using defaults'
          );
          return null;
        }

        const settings = window.DiamondThemeSettings;
        console.log('[DIAMOND PRICING] Found theme settings:', settings);

        // Log specific markup values for debugging
        const naturalSettings = Object.keys(settings)
          .filter((key) => key.startsWith('natural_'))
          .reduce((obj, key) => {
            obj[key] = settings[key];
            return obj;
          }, {});
        console.log(
          '[DIAMOND PRICING] Natural diamond markup settings:',
          naturalSettings
        );

        const labSettings = Object.keys(settings)
          .filter((key) => key.startsWith('lab_'))
          .reduce((obj, key) => {
            obj[key] = settings[key];
            return obj;
          }, {});
        console.log(
          '[DIAMOND PRICING] Lab diamond markup settings:',
          labSettings
        );

        return settings;
      } catch (error) {
        console.warn(
          '[DIAMOND PRICING] Error getting theme settings from window:',
          error
        );
        return null;
      }
    },

    // Parse theme settings into carat ranges with multipliers
    parseThemeSettingsToRanges(settings, type) {
      console.log(
        `[DIAMOND PRICING] parseThemeSettingsToRanges called for type: ${type}`,
        settings
      );

      const defaultRanges =
        this._defaultRanges[type] || this._defaultRanges.natural;

      if (!settings) {
        console.log(
          '[DIAMOND PRICING] No settings provided, using default ranges'
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

      console.log(`[DIAMOND PRICING] Looking for settings with keys:`, keys);

      const ranges = defaultRanges.map((range, index) => {
        const settingKey = keys[index];
        const settingValue = settings[settingKey];
        const parsedValue = parseFloat(settingValue || '1.0');

        // Use 1.0 (no markup) if the value is not a valid number
        const multiplier = isNaN(parsedValue) ? 1.0 : parsedValue;

        console.log(
          `[DIAMOND PRICING] Range ${index}: ${range.min}-${range.max} carat -> key: ${settingKey}, setting: ${settingValue}, multiplier: ${multiplier}`
        );

        return {
          ...range,
          multiplier,
        };
      });

      console.log(`[DIAMOND PRICING] Final parsed ranges for ${type}:`, ranges);

      // Log summary of markup multipliers for easy verification
      const nonDefaultRanges = ranges.filter((r) => r.multiplier !== 1.0);
      if (nonDefaultRanges.length > 0) {
        console.log(
          `[DIAMOND PRICING] ✅ MARKUP ACTIVE for ${type} diamonds:`,
          nonDefaultRanges
            .map((r) => `${r.min}-${r.max} carat: ${r.multiplier}x`)
            .join(', ')
        );
      } else {
        console.log(
          `[DIAMOND PRICING] ℹ️  No markup multipliers set for ${type} diamonds (all ranges: 1.0x)`
        );
      }

      return ranges;
    },

    // Get markup multiplier for a diamond based on its carat and type
    getMarkupMultiplier(carat, type, markupRanges) {
      if (!carat || carat <= 0) {
        console.warn(
          `[DIAMOND PRICING] Invalid carat value: ${carat}, using multiplier 1.0`
        );
        return 1.0;
      }

      // Find the appropriate range (exclusive upper bound except for the last range)
      const range = markupRanges.find((range, index) => {
        const isLast = index === markupRanges.length - 1;
        const inRange = isLast
          ? carat >= range.min && carat <= range.max
          : carat >= range.min && carat < range.max;
        return inRange;
      });

      if (!range) {
        console.warn(
          `[DIAMOND PRICING] No markup range found for carat: ${carat}, type: ${type}, using multiplier 1.0`
        );
        return 1.0;
      }

      return range.multiplier;
    },

    // Calculate final price with markup applied and rounded to nearest 100 SEK
    calculateFinalPriceSek(basePriceSek, carat, type, markupRanges) {
      if (!basePriceSek || basePriceSek <= 0) {
        console.warn(`[DIAMOND PRICING] Invalid base price: ${basePriceSek}`);
        return 0;
      }

      const multiplier = this.getMarkupMultiplier(carat, type, markupRanges);
      const priceWithMarkup = basePriceSek * multiplier;

      // Round to nearest 100 SEK
      const finalPrice = Math.round(priceWithMarkup / 100) * 100;

      return finalPrice;
    },

    // Apply markup to a diamond's price (main function to be called by other modules)
    async applyMarkupToDiamond(diamond) {
      try {
        const settings = await this.fetchThemeSettings();

        // Determine diamond type - check for lab-grown indicators
        const isLabGrown =
          diamond.type === 'lab' ||
          (diamond.certificateNumber &&
            diamond.certificateNumber.toString().startsWith('LG'));
        const diamondType = isLabGrown ? 'lab' : 'natural';

        // Get markup ranges for this diamond type
        const markupRanges = this.parseThemeSettingsToRanges(
          settings,
          diamondType
        );

        // Calculate final price if we have a base price in SEK
        if (diamond.totalPriceSek && diamond.carat) {
          const finalPriceSek = this.calculateFinalPriceSek(
            diamond.totalPriceSek,
            diamond.carat,
            diamondType,
            markupRanges
          );

          const result = {
            ...diamond,
            finalPriceSek,
            markupApplied: true,
            // Add debug info
            _debugInfo: {
              originalPrice: diamond.totalPriceSek,
              multiplier: this.getMarkupMultiplier(
                diamond.carat,
                diamondType,
                markupRanges
              ),
              diamondType,
              carat: diamond.carat,
            },
          };

          return result;
        } else {
          console.warn(
            `[DIAMOND PRICING] Missing required data for diamond ${diamond.itemId}:`,
            {
              hasTotalPriceSek: !!diamond.totalPriceSek,
              hasCarat: !!diamond.carat,
            }
          );
        }

        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false,
        };
      } catch (error) {
        console.warn('[DIAMOND PRICING] Error applying markup:', error);
        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false,
        };
      }
    },
  };

  // Expose clearCache globally for testing
  window.clearDiamondPricingCache = () => {
    window.DiamondPricing.clearCache();
  };

  // Expose theme settings test function for debugging
  window.testThemeSettings = () => {
    console.log('[DIAMOND PRICING TEST] Testing theme settings from window...');

    try {
      const result = window.DiamondPricing._getSettingsFromWindow();
      console.log('[DIAMOND PRICING TEST] Result:', result);
      return result;
    } catch (error) {
      console.error('[DIAMOND PRICING TEST] Error:', error);
      return null;
    }
  };

  // Expose direct settings fetch for debugging
  window.fetchThemeSettingsDebug = () => {
    return window.DiamondPricing.fetchThemeSettings();
  };
}
