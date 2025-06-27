// Diamond Filters Buttons Module
if (typeof window !== 'undefined') {
  window.DiamondFiltersButtons = {
    // Initialize all button groups
    initialize() {
      this.setupFilterButtonGroups();
      this.setupFancyColorFilters();
    },

    // Setup filter button groups
    setupFilterButtonGroups() {
      const state = window.DiamondSearchState;
      const filterGroups = document.querySelectorAll('[data-filter-group]');

      filterGroups.forEach((group) => {
        const groupId = group.dataset.filterGroup;
        const isMultiSelect = group.dataset.multiselect === 'true';
        const buttons = group.querySelectorAll('button');

        // Initialize filter state
        if (isMultiSelect && groupId === 'ds-certificate') {
          if (!Array.isArray(state.getFilter(groupId))) {
            state.setFilter(groupId, []);
            if (!state.getFilter('ds-certificate-initial-state')) {
              buttons.forEach((btn) => {
                if (btn.dataset.active === 'true') {
                  const currentFilters = state.getFilter(groupId) || [];
                  currentFilters.push(btn.dataset.value);
                  state.setFilter(groupId, currentFilters);
                }
              });
            }
          }
        } else {
          if (!state.getFilter(groupId)) {
            buttons.forEach((btn) => {
              if (btn.dataset.active === 'true') {
                state.setFilter(groupId, btn.dataset.value);
              }
            });
          }
        }

        // Add event listeners
        buttons.forEach((button) => {
          if (button.hasAttribute('data-listener-attached')) return;
          button.setAttribute('data-listener-attached', 'true');

          button.addEventListener('click', () => {
            this.handleFilterButtonClick(button, groupId, isMultiSelect);
          });
        });
      });
    },

    // Handle filter button click
    handleFilterButtonClick(button, groupId, isMultiSelect) {
      const state = window.DiamondSearchState;
      const value = button.dataset.value;

      if (isMultiSelect && groupId === 'ds-certificate') {
        this.handleCertificateFilter(button, groupId, value);
      } else {
        this.handleSingleSelectFilter(button, groupId, value);
      }
    },

    // Handle certificate filter (multi-select)
    handleCertificateFilter(button, groupId, value) {
      const state = window.DiamondSearchState;
      let currentFilters = state.getFilter(groupId) || [];

      if (state.getFilter('ds-certificate-initial-state')) {
        // First click after initial state
        state.setFilter('ds-certificate-initial-state', false);
        state.setFilter(groupId, [value]);
        button.dataset.active = 'true';
        button.setAttribute('aria-pressed', 'true');
      } else {
        // Normal multi-select behavior
        const currentIndex = currentFilters.indexOf(value);

        if (currentIndex > -1) {
          currentFilters.splice(currentIndex, 1);
          button.dataset.active = 'false';
          button.setAttribute('aria-pressed', 'false');

          if (currentFilters.length === 0) {
            state.setFilter('ds-certificate-initial-state', true);
            state.setFilter(groupId, ['GIA', 'IGI', 'HRD']);
          } else {
            state.setFilter(groupId, currentFilters);
          }
        } else {
          currentFilters.push(value);
          state.setFilter(groupId, currentFilters);
          button.dataset.active = 'true';
          button.setAttribute('aria-pressed', 'true');
        }
      }

      this.updateCertificateFilterVisualState();
      state.logCurrentFilters();
      window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
    },

    // Update certificate filter visual states
    updateCertificateFilterVisualState() {
      const state = window.DiamondSearchState;
      const certificateGroup = document.querySelector(
        '[data-filter-group="ds-certificate"]'
      );
      if (!certificateGroup) return;

      const activeCertificates = state.getFilter('ds-certificate');
      const isInitialState = state.getFilter('ds-certificate-initial-state');

      const buttons = certificateGroup.querySelectorAll('button');
      buttons.forEach((button) => {
        const value = button.dataset.value;
        const isActive =
          !isInitialState &&
          Array.isArray(activeCertificates) &&
          activeCertificates.includes(value);
        button.dataset.active = isActive ? 'true' : 'false';
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    },

    // Handle single select filter
    handleSingleSelectFilter(button, groupId, value) {
      const state = window.DiamondSearchState;
      const group = button.closest('[data-filter-group]');

      const previousActiveButton = group.querySelector(
        `button[data-active="true"]`
      );
      if (previousActiveButton) {
        previousActiveButton.dataset.active = 'false';
        previousActiveButton.setAttribute('aria-pressed', 'false');
      }

      state.setFilter(groupId, value);
      button.dataset.active = 'true';
      button.setAttribute('aria-pressed', 'true');

      if (groupId === 'ds-shape' || groupId === 'ds-type') {
        state.logCurrentFilters();
        window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
      }
    },

    // Setup fancy color multi-select filters
    setupFancyColorFilters() {
      const state = window.DiamondSearchState;
      const fancyColorGroup = document.querySelector(
        '[data-filter-group="ds-fancy-colour"]'
      );

      if (!fancyColorGroup) return;

      // Initialize state for fancy colors
      if (!Array.isArray(state.getFilter('ds-fancy-colour'))) {
        state.setFilter('ds-fancy-colour', []);
      }

      const buttons = fancyColorGroup.querySelectorAll('button');

      buttons.forEach((button) => {
        if (button.hasAttribute('data-fancy-listener-attached')) return;
        button.setAttribute('data-fancy-listener-attached', 'true');

        button.addEventListener('click', () => {
          this.handleFancyColorClick(button);
        });
      });
    },

    // Handle fancy color button clicks
    handleFancyColorClick(button) {
      const state = window.DiamondSearchState;
      const value = button.dataset.value;

      // Ensure we always have an array for fancy colours
      let currentFilters = state.getFilter('ds-fancy-colour');
      if (!Array.isArray(currentFilters)) {
        currentFilters = [];
      }

      const currentIndex = currentFilters.indexOf(value);

      if (currentIndex > -1) {
        // Remove from selection
        currentFilters.splice(currentIndex, 1);
        button.dataset.active = 'false';
        button.setAttribute('aria-pressed', 'false');
      } else {
        // Add to selection
        currentFilters.push(value);
        button.dataset.active = 'true';
        button.setAttribute('aria-pressed', 'true');
      }

      state.setFilter('ds-fancy-colour', currentFilters);

      // Reset fancy intensity slider to full range whenever a color is selected/deselected
      const fancyIntensitySlider = document.getElementById(
        'ds-fancy-intensity-slider'
      );
      if (fancyIntensitySlider && fancyIntensitySlider.noUiSlider) {
        const state = window.DiamondSearchState;
        const defaultRange = state.DEFAULT_FILTER_RANGES.fancyIntensity;
        console.log(
          '[FANCY COLOR DEBUG] Resetting intensity slider to:',
          defaultRange
        );
        // Reset to default full range using label values
        fancyIntensitySlider.noUiSlider.set(defaultRange);
        // Verify the reset worked
        const newValues = fancyIntensitySlider.noUiSlider.get();
        console.log(
          '[FANCY COLOR DEBUG] Intensity slider after reset:',
          newValues
        );
      }

      state.logCurrentFilters();

      // Small delay to ensure slider reset takes effect before API call
      setTimeout(() => {
        // Trigger diamond data fetch with current filters
        window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
      }, 100);
    },
  };
}
