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

      console.log('[DIAMOND INIT] triggerInitialLoad called', {
        allSlidersInitialized: state.areAllSlidersInitialized(),
        initialLoadComplete: state.initialLoadComplete,
        sliderStates: state.sliderInitializationState,
      });

      if (state.areAllSlidersInitialized() && !state.initialLoadComplete) {
        console.log(
          '[DIAMOND INIT] All sliders ready, applying initial filters'
        );
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
    window.DiamondFiltersUtils &&
    window.DiamondFiltersSliders &&
    window.DiamondFiltersButtons &&
    window.DiamondFiltersTabs &&
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
        window.DiamondFiltersUtils &&
        window.DiamondFiltersSliders &&
        window.DiamondFiltersButtons &&
        window.DiamondFiltersTabs &&
        window.DiamondUI &&
        window.DiamondDetails
      ) {
        window.DiamondSearchApp.initialize();
      } else {
        console.warn('[DIAMOND SEARCH] Some modules failed to load');
        // Log which modules are missing
        const modules = {
          DiamondSearchState: window.DiamondSearchState,
          DiamondAPI: window.DiamondAPI,
          DiamondRenderer: window.DiamondRenderer,
          DiamondFilters: window.DiamondFilters,
          DiamondFiltersUtils: window.DiamondFiltersUtils,
          DiamondFiltersSliders: window.DiamondFiltersSliders,
          DiamondFiltersButtons: window.DiamondFiltersButtons,
          DiamondFiltersTabs: window.DiamondFiltersTabs,
          DiamondUI: window.DiamondUI,
          DiamondDetails: window.DiamondDetails,
        };
        Object.entries(modules).forEach(([name, module]) => {
          if (!module) {
            console.warn(`[DIAMOND SEARCH] Missing module: ${name}`);
          }
        });
      }
    }, 100);
  }

  // Override the slider initialization callback
  const originalMarkSliderInitialized =
    window.DiamondSearchState.markSliderInitialized;
  window.DiamondSearchState.markSliderInitialized = function (sliderType) {
    originalMarkSliderInitialized.call(this, sliderType);

    console.log(`[DIAMOND INIT] Slider initialized: ${sliderType}`, {
      totalInitialized: Object.values(this.sliderInitializationState).filter(
        Boolean
      ).length,
      totalSliders: Object.keys(this.sliderInitializationState).length,
      allReady: this.areAllSlidersInitialized(),
    });

    // Check if all sliders are now initialized and trigger initial load
    if (this.areAllSlidersInitialized() && !this.initialLoadComplete) {
      window.DiamondSearchApp.triggerInitialLoad();
    }
  };
}
