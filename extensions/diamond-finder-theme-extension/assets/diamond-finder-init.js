// Diamond Search Main Application Controller
if (typeof window !== 'undefined') {
  window.DiamondSearchApp = {
    // Initialize the entire application
    initialize() {
      // Wait for DOM to be ready
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => this.start());
      } else {
        this.start();
      }
    },

    // Start the application
    start() {
      // Initialize sliders first (they trigger the initial data fetch when all are ready)
      window.DiamondFilters.initializeSliders();

      // Setup UI components
      window.DiamondUI.initialize();

      // Setup diamond details functionality
      window.DiamondDetails.initialize();

      // Setup additional event handlers
      this.setupAdditionalEventHandlers();
    },

    // Setup any additional event handlers not covered by other modules
    setupAdditionalEventHandlers() {
      // Apply filters button (if it exists)
      const applyFiltersButton = document.getElementById('ds-apply-filters');
      if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', () => {
          const state = window.DiamondSearchState;
          state.logCurrentFilters();
          window.DiamondAPI.fetchDiamondData(
            1,
            state.paginationInfo.limit || 24
          );
        });
      }
    },

    // Method to trigger initial load after all sliders are initialized
    triggerInitialLoad() {
      const state = window.DiamondSearchState;

      if (state.areAllSlidersInitialized() && !state.initialLoadComplete) {
        window.DiamondUI.applyInitialFilters();
      }
    },
  };

  // Auto-initialize when all modules are loaded
  if (
    window.DiamondSearchState &&
    window.DiamondAPI &&
    window.DiamondRenderer &&
    window.DiamondFilters &&
    window.DiamondUI &&
    window.DiamondDetails
  ) {
    window.DiamondSearchApp.initialize();
  } else {
    // Fallback: wait a bit for all modules to load
    setTimeout(() => {
      if (
        window.DiamondSearchState &&
        window.DiamondAPI &&
        window.DiamondRenderer &&
        window.DiamondFilters &&
        window.DiamondUI &&
        window.DiamondDetails
      ) {
        window.DiamondSearchApp.initialize();
      } else {
        console.warn('[DIAMOND SEARCH] Some modules failed to load');
      }
    }, 100);
  }

  // Override the slider initialization callback
  const originalMarkSliderInitialized =
    window.DiamondSearchState.markSliderInitialized;
  window.DiamondSearchState.markSliderInitialized = function (sliderType) {
    originalMarkSliderInitialized.call(this, sliderType);

    // Check if all sliders are now initialized and trigger initial load
    if (this.areAllSlidersInitialized() && !this.initialLoadComplete) {
      window.DiamondSearchApp.triggerInitialLoad();
    }
  };
}
