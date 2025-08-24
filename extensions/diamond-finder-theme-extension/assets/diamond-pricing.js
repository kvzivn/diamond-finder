// Diamond Pricing Module - Client-side markup application
if (typeof window !== 'undefined') {
  window.DiamondPricing = {
    // Store intervals for the current page session only (no persistent caching)
    _currentIntervals: null,

    // Default markup ranges if API can't be reached
    _defaultRanges: {
      natural: Array.from({ length: 50 }, (_, i) => ({
        min: i * 0.1,
        max: i === 49 ? 5.0 : i * 0.1 + 0.09,
        multiplier: 1.0,
      })),
      lab: Array.from({ length: 50 }, (_, i) => ({
        min: i * 0.1,
        max: i === 49 ? 5.0 : i * 0.1 + 0.09,
        multiplier: 1.0,
      })),
    },

    // Clear cache (kept for compatibility but now just clears current intervals)
    clearCache() {
      this._currentIntervals = null;
    },

    // Fetch markup intervals from the database API - once per page load
    async fetchMarkupIntervals() {
      // If we already have intervals for this page session, return them
      if (this._currentIntervals) {
        return this._currentIntervals;
      }

      // Fetch fresh data on first call
      try {
        const response = await fetch(
          `/apps/api/markup-intervals?t=${Date.now()}`
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        this._currentIntervals = data;

        console.log(
          '[DIAMOND PRICING] Loaded fresh markup intervals from database:',
          {
            natural: data.natural?.length || 0,
            lab: data.lab?.length || 0,
            fallback: data.fallback || false,
          }
        );

        return this._currentIntervals;
      } catch (error) {
        console.warn(
          '[DIAMOND PRICING] Failed to fetch markup intervals from API:',
          error
        );

        // Use defaults if API fails
        return this._defaultRanges;
      }
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

      // Only round to nearest 100 SEK if multiplier is not 1.0
      // When multiplier is 1.0, return exact price
      const finalPrice =
        multiplier === 1.0
          ? priceWithMarkup
          : Math.round(priceWithMarkup / 100) * 100;

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
        const markupRanges =
          intervals[diamondType] ||
          intervals.natural ||
          this._defaultRanges.natural;

        // Calculate final price if we have a base price in SEK
        if (diamond.totalPriceSek && diamond.carat) {
          const multiplier = this.getMarkupMultiplier(
            diamond.carat,
            diamondType,
            markupRanges
          );

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
              multiplier: multiplier,
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
    return window.DiamondPricing.fetchMarkupIntervals().then((intervals) => {
      const ranges = intervals[type] || intervals.natural;
      const multiplier = window.DiamondPricing.getMarkupMultiplier(
        carat,
        type,
        ranges
      );
      return {
        carat,
        type,
        multiplier,
        markupPercent: Math.round((multiplier - 1) * 100),
        availableRanges: ranges.length,
      };
    });
  };
}
