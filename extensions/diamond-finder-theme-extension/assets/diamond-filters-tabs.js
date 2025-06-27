// Diamond Filters Tabs Module
if (typeof window !== 'undefined') {
  window.DiamondFiltersTabs = {
    // Setup colour tab switching
    initialize() {
      this.setupColourTabs();
    },

    // Setup colour tab switching
    setupColourTabs() {
      const whiteTab = document.getElementById('ds-colour-tab-white');
      const fancyTab = document.getElementById('ds-colour-tab-fancy');
      const whitePanel = document.getElementById('ds-colour-panel-white');
      const fancyPanel = document.getElementById('ds-colour-panel-fancy');

      if (!whiteTab || !fancyTab || !whitePanel || !fancyPanel) return;

      const switchTab = (activeTab) => {
        if (activeTab === 'white') {
          // Show white panel
          whitePanel.classList.remove('tw-hidden');
          fancyPanel.classList.add('tw-hidden');

          // Update tab styling using data attributes
          whiteTab.dataset.active = 'true';
          whiteTab.setAttribute('aria-pressed', 'true');

          fancyTab.dataset.active = 'false';
          fancyTab.setAttribute('aria-pressed', 'false');

          // Trigger fetch when switching back to white tab
          const debounceFetch =
            window.DiamondFiltersUtils.createDebouncedFetch();
          debounceFetch();
        } else if (activeTab === 'fancy') {
          // Show fancy panel
          fancyPanel.classList.remove('tw-hidden');
          whitePanel.classList.add('tw-hidden');

          // Update tab styling using data attributes
          fancyTab.dataset.active = 'true';
          fancyTab.setAttribute('aria-pressed', 'true');

          whiteTab.dataset.active = 'false';
          whiteTab.setAttribute('aria-pressed', 'false');

          // Clear any previously selected fancy colors when switching to fancy tab
          const state = window.DiamondSearchState;
          state.setFilter('ds-fancy-colour', []);

          // Reset all fancy color buttons to inactive state
          const fancyColorButtons = document.querySelectorAll(
            '[data-filter-group="ds-fancy-colour"] button'
          );
          fancyColorButtons.forEach((button) => {
            button.dataset.active = 'false';
            button.setAttribute('aria-pressed', 'false');
          });

          // Reset fancy intensity slider to show all intensities
          const fancyIntensitySlider = document.getElementById(
            'ds-fancy-intensity-slider'
          );
          if (fancyIntensitySlider && fancyIntensitySlider.noUiSlider) {
            const state = window.DiamondSearchState;
            const defaultRange = state.DEFAULT_FILTER_RANGES.fancyIntensity;
            // Reset to default full range using label values
            fancyIntensitySlider.noUiSlider.set(defaultRange);
            // Reset the slider changed state since we're resetting to defaults
            state.resetSliderChangedState('fancyIntensity');
          }

          // Trigger fetch to show all fancy colored diamonds
          window.DiamondAPI.fetchDiamondData(
            1,
            state.paginationInfo.limit || 24
          );
        }
      };

      whiteTab.addEventListener('click', () => switchTab('white'));
      fancyTab.addEventListener('click', () => switchTab('fancy'));
    },
  };
}
