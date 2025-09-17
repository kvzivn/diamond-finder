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

      // Setup cart functionality
      if (window.DiamondCart) {
        window.DiamondCart.initialize();
      }

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

      // Setup keyboard shortcut for pricing visibility toggle
      this.setupPricingToggleShortcut();
    },

    // Setup keyboard shortcut for toggling detailed pricing
    setupPricingToggleShortcut() {
      document.addEventListener('keydown', (event) => {
        // Check for Ctrl/Cmd + Shift + P
        const isModifierPressed = event.ctrlKey || event.metaKey; // Ctrl on Windows/Linux, Cmd on Mac
        if (isModifierPressed && event.shiftKey && event.key === 'P') {
          event.preventDefault(); // Prevent default browser behavior

          const state = window.DiamondSearchState;
          const isNowVisible = state.toggleDetailedPricing();

          // Show notification
          this.showPricingToggleNotification(isNowVisible);

          // Re-render current diamonds to reflect the change
          if (window.DiamondRenderer && state.allDiamonds.length > 0) {
            window.DiamondRenderer.renderDiamonds(state.allDiamonds);
          }

          // Update details view if it's open
          if (state.currentDiamond && window.DiamondDetails) {
            const detailsView = document.getElementById('diamond-details-view');
            if (detailsView && !detailsView.classList.contains('tw-hidden')) {
              window.DiamondDetails.populateDiamondDetails(state.currentDiamond);
            }
          }

          console.log('[PRICING TOGGLE] Detailed pricing visibility:', isNowVisible);
        }
      });
    },

    // Show notification when pricing visibility is toggled
    showPricingToggleNotification(isVisible) {
      // Remove any existing notification
      const existingNotification = document.querySelector('.pricing-toggle-notification');
      if (existingNotification) {
        existingNotification.remove();
      }

      // Create new notification
      const notification = document.createElement('div');
      notification.className = 'pricing-toggle-notification tw-fixed tw-top-4 tw-right-4 tw-bg-black tw-text-white tw-px-4 tw-py-2 tw-rounded-lg tw-shadow-lg tw-z-50 tw-transition-opacity tw-duration-300';
      notification.textContent = isVisible ? 'Detaljerad prissättning aktiverad' : 'Detaljerad prissättning dold';

      document.body.appendChild(notification);

      // Auto-remove after 2 seconds
      setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
          notification.remove();
        }, 300);
      }, 2000);
    },

    // Method to trigger initial load after all sliders are initialized
    triggerInitialLoad() {
      const state = window.DiamondSearchState;

      if (state.areAllSlidersInitialized() && !state.initialLoadComplete) {
        window.DiamondUI.applyInitialFilters();
      }
    },

    // Refresh diamond pricing after theme settings change
    async refreshDiamondPricing() {
      console.log(
        '[DIAMOND SEARCH APP] Refreshing diamond pricing with updated theme settings...'
      );

      // Clear the pricing cache to force fresh theme settings fetch
      if (window.DiamondPricing) {
        window.DiamondPricing.clearCache();
      }

      // Re-render all currently displayed diamonds with new pricing
      const state = window.DiamondSearchState;
      if (
        state.allDiamonds &&
        state.allDiamonds.length > 0 &&
        window.DiamondRenderer
      ) {
        await window.DiamondRenderer.renderDiamonds(state.allDiamonds);
        console.log(
          `[DIAMOND SEARCH APP] Re-rendered ${state.allDiamonds.length} diamonds with updated pricing`
        );
      }
    },
  };

  // Expose refresh function globally for theme settings integration
  window.refreshDiamondPricing = () => {
    if (window.DiamondSearchApp) {
      return window.DiamondSearchApp.refreshDiamondPricing();
    }
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
          DiamondCart: window.DiamondCart,
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

    // Check if all sliders are now initialized and trigger initial load
    if (this.areAllSlidersInitialized() && !this.initialLoadComplete) {
      window.DiamondSearchApp.triggerInitialLoad();
    }
  };
}
