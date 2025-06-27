// Diamond Filters Core Module
if (typeof window !== 'undefined') {
  window.DiamondFilters = {
    // Initialize all filter components
    initializeSliders() {
      // Check if all required modules are available
      if (
        !window.DiamondFiltersUtils ||
        !window.DiamondFiltersSliders ||
        !window.DiamondFiltersButtons ||
        !window.DiamondFiltersTabs
      ) {
        console.error('[DIAMOND FILTERS] Required filter modules not loaded');
        return;
      }

      window.DiamondFiltersUtils.waitForNoUiSlider(() => {
        // Initialize all sliders
        window.DiamondFiltersSliders.initializeAll();

        // Initialize button groups
        window.DiamondFiltersButtons.initialize();

        // Initialize tabs
        window.DiamondFiltersTabs.initialize();
      });
    },

    // Proxy method to get slider values (for backward compatibility)
    getSliderValues(useInitialDefaults = false) {
      if (!window.DiamondFiltersUtils) {
        console.error('[DIAMOND FILTERS] DiamondFiltersUtils not loaded');
        return {};
      }
      return window.DiamondFiltersUtils.getSliderValues(useInitialDefaults);
    },

    // Proxy method for utility functions (for backward compatibility)
    waitForNoUiSlider(callback, maxAttempts) {
      if (!window.DiamondFiltersUtils) {
        console.error('[DIAMOND FILTERS] DiamondFiltersUtils not loaded');
        return;
      }
      return window.DiamondFiltersUtils.waitForNoUiSlider(
        callback,
        maxAttempts
      );
    },

    // Proxy method for debounced fetch (for backward compatibility)
    createDebouncedFetch() {
      if (!window.DiamondFiltersUtils) {
        console.error('[DIAMOND FILTERS] DiamondFiltersUtils not loaded');
        return () => {};
      }
      return window.DiamondFiltersUtils.createDebouncedFetch();
    },

    // Proxy method for button group setup (for backward compatibility)
    setupFilterButtonGroups() {
      if (!window.DiamondFiltersButtons) {
        console.error('[DIAMOND FILTERS] DiamondFiltersButtons not loaded');
        return;
      }
      return window.DiamondFiltersButtons.setupFilterButtonGroups();
    },

    // Proxy method for certificate filter visual state update (for backward compatibility)
    updateCertificateFilterVisualState() {
      if (!window.DiamondFiltersButtons) {
        console.error('[DIAMOND FILTERS] DiamondFiltersButtons not loaded');
        return;
      }
      return window.DiamondFiltersButtons.updateCertificateFilterVisualState();
    },
  };
}
