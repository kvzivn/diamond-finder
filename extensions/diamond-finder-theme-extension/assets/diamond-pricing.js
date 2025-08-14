// Diamond Pricing Module - Client-side markup application
if (typeof window !== 'undefined') {
  window.DiamondPricing = {
    // Cache for markup intervals to avoid repeated processing
    _markupIntervals: null,
    _lastFetch: 0,
    _cacheTimeout: 5 * 60 * 1000, // 5 minutes

    // Default markup ranges if API can't be reached
    _defaultRanges: {
      natural: Array.from({ length: 50 }, (_, i) => ({
        min: i * 0.1,
        max: i === 49 ? 5.0 : (i * 0.1) + 0.09,
        multiplier: 1.0,
      })),
      lab: Array.from({ length: 50 }, (_, i) => ({
        min: i * 0.1,
        max: i === 49 ? 5.0 : (i * 0.1) + 0.09,
        multiplier: 1.0,
      })),
    },

    // Clear cache (useful for testing markup intervals changes)
    clearCache() {
      this._markupIntervals = null;
      this._lastFetch = 0;
    },

    // Fetch markup intervals from the database API
    async fetchMarkupIntervals() {
      const now = Date.now();
      
      // Use cache if it's still valid
      if (this._markupIntervals && (now - this._lastFetch) < this._cacheTimeout) {
        return this._markupIntervals;
      }

      try {
        const response = await fetch('/apps/diamond-finder/api/markup-intervals');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        this._markupIntervals = data;
        this._lastFetch = now;
        
        console.log('[DIAMOND PRICING] Loaded markup intervals from database:', {
          natural: data.natural?.length || 0,
          lab: data.lab?.length || 0,
          fallback: data.fallback || false
        });
        
        return this._markupIntervals;
      } catch (error) {
        console.warn('[DIAMOND PRICING] Failed to fetch markup intervals from API:', error);
        
        // Fallback to theme settings if available, otherwise use defaults
        const fallbackSettings = this._getSettingsFromWindow();
        if (fallbackSettings) {
          return this._convertThemeSettingsToIntervals(fallbackSettings);
        }
        
        return this._defaultRanges;
      }
    },

    // Internal method to get settings from window object (fallback)
    _getSettingsFromWindow() {
      try {
        if (!window.DiamondThemeSettings) {
          return null;
        }
        return window.DiamondThemeSettings;
      } catch (error) {
        return null;
      }
    },

    // Convert theme settings to new interval format (fallback compatibility)
    _convertThemeSettingsToIntervals(settings) {
      const ranges = {
        natural: this.parseThemeSettingsToRanges(settings, 'natural'),
        lab: this.parseThemeSettingsToRanges(settings, 'lab'),
      };
      
      console.log('[DIAMOND PRICING] Using theme settings as fallback for markup intervals');
      return ranges;
    },

    // Parse theme settings into carat ranges with multipliers
    parseThemeSettingsToRanges(settings, type) {

      const defaultRanges =
        this._defaultRanges[type] || this._defaultRanges.natural;

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


      const ranges = defaultRanges.map((range, index) => {
        const settingKey = keys[index];
        const settingValue = settings[settingKey];
        const parsedValue = parseFloat(settingValue || '1.0');

        // Use 1.0 (no markup) if the value is not a valid number
        const multiplier = isNaN(parsedValue) ? 1.0 : parsedValue;


        return {
          ...range,
          multiplier,
        };
      });



      return ranges;
    },

    // Get markup multiplier for a diamond based on its carat and type
    getMarkupMultiplier(carat, type, markupRanges) {
      if (!carat || carat <= 0) {
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
        return 1.0;
      }

      return range.multiplier;
    },

    // Calculate final price with markup applied and rounded to nearest 100 SEK
    calculateFinalPriceSek(basePriceSek, carat, type, markupRanges) {
      if (!basePriceSek || basePriceSek <= 0) {
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
        const intervals = await this.fetchMarkupIntervals();

        // Determine diamond type - check for lab-grown indicators
        const isLabGrown =
          diamond.type === 'lab' ||
          (diamond.certificateNumber &&
            diamond.certificateNumber.toString().startsWith('LG'));
        const diamondType = isLabGrown ? 'lab' : 'natural';

        // Get markup ranges for this diamond type
        const markupRanges = intervals[diamondType] || intervals.natural || this._defaultRanges.natural;

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
              intervalsSource: intervals.fallback ? 'fallback' : 'database',
            },
          };

          return result;
        }

        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false,
        };
      } catch (error) {
        console.error('[DIAMOND PRICING] Error applying markup:', error);
        return {
          ...diamond,
          finalPriceSek: diamond.totalPriceSek || 0,
          markupApplied: false,
        };
      }
    },
  };

  // Expose clearCache globally for testing and cache invalidation
  window.clearDiamondPricingCache = () => {
    window.DiamondPricing.clearCache();
  };

  // Expose direct intervals fetch for debugging
  window.fetchMarkupIntervalsDebug = () => {
    return window.DiamondPricing.fetchMarkupIntervals();
  };

  // Test function to check markup calculation for debugging
  window.testMarkupCalculation = (carat, type) => {
    return window.DiamondPricing.fetchMarkupIntervals().then(intervals => {
      const ranges = intervals[type] || intervals.natural;
      const multiplier = window.DiamondPricing.getMarkupMultiplier(carat, type, ranges);
      return {
        carat,
        type,
        multiplier,
        markupPercent: Math.round((multiplier - 1) * 100),
        availableRanges: ranges.length
      };
    });
  };
}
