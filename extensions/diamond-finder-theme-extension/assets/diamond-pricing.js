// Diamond Pricing Module - Simplified for display purposes only
// All price calculations now happen server-side
if (typeof window !== 'undefined') {
  window.DiamondPricing = {
    // Calculate markup multiplier for display purposes
    calculateMarkupMultiplier(diamond) {
      if (diamond.priceWithMarkupSek && diamond.totalPriceSek && diamond.totalPriceSek > 0) {
        return diamond.priceWithMarkupSek / diamond.totalPriceSek;
      }
      return 1.0;
    },

    // Format price for display
    formatPrice(price, currency = 'SEK') {
      if (typeof price !== 'number') {
        return 'Pris ej tillgängligt';
      }
      return `${price.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} ${currency}`;
    },

    // Get display prices from diamond object
    getDisplayPrices(diamond) {
      const prices = {
        basePriceSek: diamond.totalPriceSek || null,
        priceWithMarkupSek: diamond.priceWithMarkupSek || null,
        finalPriceSek: diamond.finalPriceSek || null,
        basePriceUsd: diamond.totalPrice || null,
        multiplier: this.calculateMarkupMultiplier(diamond),
      };

      return prices;
    },

    // Legacy function kept for compatibility - returns diamond as-is since pricing is server-side
    async applyMarkupToDiamond(diamond) {
      // Prices are already calculated server-side
      return {
        ...diamond,
        markupApplied: true,
        _debugInfo: {
          originalPrice: diamond.totalPriceSek,
          multiplier: this.calculateMarkupMultiplier(diamond),
          diamondType: diamond.type || 'natural',
          carat: diamond.carat,
          intervalsSource: 'server',
        },
      };
    },
  };

  // Debugging function to check diamond prices
  window.debugDiamondPrices = (diamond) => {
    const prices = window.DiamondPricing.getDisplayPrices(diamond);
    console.log('[DIAMOND PRICING DEBUG]', {
      itemId: diamond.itemId,
      carat: diamond.carat,
      type: diamond.type,
      basePriceSek: prices.basePriceSek,
      priceWithMarkupSek: prices.priceWithMarkupSek,
      finalPriceSek: prices.finalPriceSek,
      multiplier: prices.multiplier,
      markupPercent: Math.round((prices.multiplier - 1) * 100),
    });
    return prices;
  };
}
