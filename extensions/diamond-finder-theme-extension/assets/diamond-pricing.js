// Diamond Pricing Module - Client-side markup application
if (typeof window !== 'undefined') {
  window.DiamondPricing = {
    // Cache for theme settings to avoid repeated API calls
    _themeSettings: null,
    _settingsPromise: null,

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
      ]
    },

    // Fetch theme settings from the API
    async fetchThemeSettings() {
      if (this._themeSettings) {
        return this._themeSettings;
      }

      if (this._settingsPromise) {
        return this._settingsPromise;
      }

      this._settingsPromise = this._fetchSettingsFromAPI();
      this._themeSettings = await this._settingsPromise;
      return this._themeSettings;
    },

    // Internal method to fetch settings from API
    async _fetchSettingsFromAPI() {
      try {
        const response = await fetch('/api/theme-settings');
        if (!response.ok) {
          console.warn('[DIAMOND PRICING] Failed to fetch theme settings, using defaults');
          return null;
        }
        
        const data = await response.json();
        if (data.settings) {
          console.log('[DIAMOND PRICING] Successfully loaded theme settings');
          return data.settings;
        }
        
        return null;
      } catch (error) {
        console.warn('[DIAMOND PRICING] Error fetching theme settings:', error);
        return null;
      }
    },

    // Parse theme settings into carat ranges with multipliers
    parseThemeSettingsToRanges(settings, type) {
      const defaultRanges = this._defaultRanges[type] || this._defaultRanges.natural;

      if (!settings) {
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

      return defaultRanges.map((range, index) => {
        const settingValue = settings[keys[index]];
        const parsedValue = parseFloat(settingValue || '1.0');
        
        // Use 1.0 (no markup) if the value is not a valid number
        const multiplier = isNaN(parsedValue) ? 1.0 : parsedValue;
        
        return {
          ...range,
          multiplier
        };
      });
    },

    // Get markup multiplier for a diamond based on its carat and type
    getMarkupMultiplier(carat, type, markupRanges) {
      if (!carat || carat <= 0) {
        console.warn(`[DIAMOND PRICING] Invalid carat value: ${carat}, using multiplier 1.0`);
        return 1.0;
      }

      // Find the appropriate range (exclusive upper bound except for the last range)
      const range = markupRanges.find((range, index) => {
        if (index === markupRanges.length - 1) {
          // Last range includes the upper bound
          return carat >= range.min && carat <= range.max;
        } else {
          // Other ranges exclude the upper bound
          return carat >= range.min && carat < range.max;
        }
      });

      if (!range) {
        console.warn(`[DIAMOND PRICING] No markup range found for carat: ${carat}, type: ${type}, using multiplier 1.0`);
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
        const isLabGrown = diamond.type === 'lab' || 
                          (diamond.certificateNumber && diamond.certificateNumber.toString().startsWith('LG'));
        const diamondType = isLabGrown ? 'lab' : 'natural';
        
        // Get markup ranges for this diamond type
        const markupRanges = this.parseThemeSettingsToRanges(settings, diamondType);
        
        // Calculate final price if we have a base price in SEK
        if (diamond.totalPriceSek && diamond.carat) {
          const finalPriceSek = this.calculateFinalPriceSek(
            diamond.totalPriceSek, 
            diamond.carat, 
            diamondType, 
            markupRanges
          );
          
          return {
            ...diamond,
            finalPriceSek,
            markupApplied: true
          };
        }
        
        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false
        };
      } catch (error) {
        console.warn('[DIAMOND PRICING] Error applying markup:', error);
        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false
        };
      }
    }
  };
}