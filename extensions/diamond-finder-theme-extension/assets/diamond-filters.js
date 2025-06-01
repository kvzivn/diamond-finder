// Diamond Filters Module
if (typeof window !== 'undefined') {

  window.DiamondFilters = {

    // Wait for noUiSlider to be available
    waitForNoUiSlider(callback, maxAttempts = 100) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (typeof window !== 'undefined' && window.noUiSlider && typeof window.noUiSlider.create === 'function') {
          clearInterval(checkInterval);
          console.log('[DIAMOND FILTERS] noUiSlider loaded successfully');
          callback();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error('[DIAMOND FILTERS] noUiSlider library failed to load after', maxAttempts * 50, 'ms');
          // Try to load a fallback or show an error message
        }
      }, 50);
    },

    // Get current slider values
    getSliderValues(useInitialDefaults = false) {
      const state = window.DiamondSearchState;

      if (useInitialDefaults) {
        return {
          price: state.DEFAULT_FILTER_RANGES.price.map(String),
          carat: state.DEFAULT_FILTER_RANGES.carat.map(val => val.toFixed(2)),
          colour: state.DEFAULT_FILTER_RANGES.colour,
          clarity: state.DEFAULT_FILTER_RANGES.clarity,
          cutGrade: state.DEFAULT_FILTER_RANGES.cutGrade,
          fluorescence: state.DEFAULT_FILTER_RANGES.fluorescence,
          polish: state.DEFAULT_FILTER_RANGES.polish,
          symmetry: state.DEFAULT_FILTER_RANGES.symmetry,
          table: state.DEFAULT_FILTER_RANGES.table.map(val => val + '%'),
          ratio: state.DEFAULT_FILTER_RANGES.ratio.map(val => val.toFixed(2))
        };
      }

      const values = {};

      const priceSliderEl = document.getElementById('ds-price-slider');
      if (priceSliderEl && priceSliderEl.noUiSlider) {
        values.price = priceSliderEl.noUiSlider.get();
      }

      const caratSliderEl = document.getElementById('ds-carat-slider');
      if (caratSliderEl && caratSliderEl.noUiSlider) {
        values.carat = caratSliderEl.noUiSlider.get();
      }

      const colourSliderEl = document.getElementById('ds-colour-slider-noui');
      if (colourSliderEl && colourSliderEl.noUiSlider) {
        values.colour = colourSliderEl.noUiSlider.get();
      }

      const claritySliderEl = document.getElementById('ds-clarity-slider-noui');
      if (claritySliderEl && claritySliderEl.noUiSlider) {
        values.clarity = claritySliderEl.noUiSlider.get();
      }

      const cutGradeSliderEl = document.getElementById('ds-cut-grade-slider-noui');
      if (cutGradeSliderEl && cutGradeSliderEl.noUiSlider) {
        values.cutGrade = cutGradeSliderEl.noUiSlider.get();
      }

      const fluorescenceSliderEl = document.getElementById('ds-fluorescence-slider-noui');
      if (fluorescenceSliderEl && fluorescenceSliderEl.noUiSlider) {
        values.fluorescence = fluorescenceSliderEl.noUiSlider.get();
      }

      const polishSliderEl = document.getElementById('ds-polish-slider-noui');
      if (polishSliderEl && polishSliderEl.noUiSlider) {
        values.polish = polishSliderEl.noUiSlider.get();
      }

      const symmetrySliderEl = document.getElementById('ds-symmetry-slider-noui');
      if (symmetrySliderEl && symmetrySliderEl.noUiSlider) {
        values.symmetry = symmetrySliderEl.noUiSlider.get();
      }

      const tableSliderEl = document.getElementById('ds-table-slider');
      if (tableSliderEl && tableSliderEl.noUiSlider) {
        values.table = tableSliderEl.noUiSlider.get();
      }

      const ratioSliderEl = document.getElementById('ds-ratio-slider');
      if (ratioSliderEl && ratioSliderEl.noUiSlider) {
        values.ratio = ratioSliderEl.noUiSlider.get();
      }

      return values;
    },

    // Initialize all sliders
    initializeSliders() {
      this.waitForNoUiSlider(() => {
        this.initializePriceSlider();
        this.initializeCaratSlider();
        this.initializeColourSlider();
        this.initializeClaritySlider();
        this.initializeCutGradeSlider();
        this.initializeFluorescenceSlider();
        this.initializePolishSlider();
        this.initializeSymmetrySlider();
        this.initializeTableSlider();
        this.initializeRatioSlider();
      });
    },

    // Initialize price slider
    initializePriceSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for price slider');
        return;
      }

      const state = window.DiamondSearchState;
      const priceSlider = document.getElementById('ds-price-slider');
      const minPriceInput = document.getElementById('ds-min-price');
      const maxPriceInput = document.getElementById('ds-max-price');

      if (!priceSlider || !minPriceInput || !maxPriceInput) return;

      const debounceFetch = this.createDebouncedFetch();

      window.noUiSlider.create(priceSlider, {
        start: state.DEFAULT_FILTER_RANGES.price,
        connect: true,
        step: 1000,
        range: {
          'min': 2500,
          'max': 10000000
        },
        format: {
          to: function (value) {
            return Math.round(value).toLocaleString('sv-SE').replace(/,/g, ' ');
          },
          from: function (value) {
            return Number(value.replace(/\s/g, ''));
          }
        }
      });

      priceSlider.noUiSlider.on('update', function (values, handle) {
        const value = values[handle].replace(/\s/g, '');
        if (handle === 0) {
          minPriceInput.value = value;
        } else {
          maxPriceInput.value = value;
        }
      });

      priceSlider.noUiSlider.on('change', debounceFetch);

      minPriceInput.addEventListener('change', function () {
        priceSlider.noUiSlider.set([this.value, null]);
      });
      maxPriceInput.addEventListener('change', function () {
        priceSlider.noUiSlider.set([null, this.value]);
      });

      state.markSliderInitialized('price');
    },

    // Initialize carat slider
    initializeCaratSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for carat slider');
        return;
      }

      const state = window.DiamondSearchState;
      const caratSlider = document.getElementById('ds-carat-slider');
      const minCaratInput = document.getElementById('ds-min-carat');
      const maxCaratInput = document.getElementById('ds-max-carat');

      if (!caratSlider || !minCaratInput || !maxCaratInput) return;

      const debounceFetch = this.createDebouncedFetch();

      // Create array of valid carat values
      const caratValues = [];
      for (let i = 0.10; i <= 10.00; i += 0.05) {
        caratValues.push(parseFloat(i.toFixed(2)));
      }
      caratValues.push(15.00, 20.00, 25.00, 30.00);

      function snapToValidCaratValue(value) {
        return caratValues.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      }

      window.noUiSlider.create(caratSlider, {
        start: state.DEFAULT_FILTER_RANGES.carat,
        connect: true,
        step: 0.05,
        range: {
          'min': 0.10,
          'max': 30.00
        },
        format: {
          to: function(value) {
            const snapped = snapToValidCaratValue(value);
            return snapped.toFixed(2);
          },
          from: function(value) {
            return Number(value);
          }
        }
      });

      caratSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minCaratInput.value = values[handle];
          const minCaratSelect = document.getElementById('ds-min-carat');
          if (minCaratSelect) minCaratSelect.value = values[handle];
        } else {
          maxCaratInput.value = values[handle];
          const maxCaratSelect = document.getElementById('ds-max-carat');
          if (maxCaratSelect) maxCaratSelect.value = values[handle];
        }
      });

      caratSlider.noUiSlider.on('change', debounceFetch);

      // Add event listeners for select dropdowns
      const minCaratSelect = document.getElementById('ds-min-carat');
      const maxCaratSelect = document.getElementById('ds-max-carat');

      if (minCaratSelect) {
        minCaratSelect.addEventListener('change', function () {
          if (this.value) {
            caratSlider.noUiSlider.set([this.value, null]);
            debounceFetch();
          }
        });
      }

      if (maxCaratSelect) {
        maxCaratSelect.addEventListener('change', function () {
          if (this.value) {
            caratSlider.noUiSlider.set([null, this.value]);
            debounceFetch();
          }
        });
      }

      state.markSliderInitialized('carat');
    },

    // Initialize colour slider
    initializeColourSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for colour slider');
        return;
      }

      const state = window.DiamondSearchState;
      const colourSlider = document.getElementById('ds-colour-slider-noui');

      if (!colourSlider) return;

      const colorLabels = state.FILTER_LABELS.colour;

      window.noUiSlider.create(colourSlider, {
        start: state.DEFAULT_FILTER_RANGES.colour,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 8
        },
        format: {
          to: function (value) {
            return colorLabels[Math.round(value)];
          },
          from: function (value) {
            return colorLabels.indexOf(value);
          }
        }
      });

      setTimeout(() => {
        state.markSliderInitialized('colour');
      }, 10);
    },

    // Initialize clarity slider
    initializeClaritySlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for clarity slider');
        return;
      }

      const state = window.DiamondSearchState;
      const claritySlider = document.getElementById('ds-clarity-slider-noui');

      if (!claritySlider) return;

      const clarityLabels = state.FILTER_LABELS.clarity;

      window.noUiSlider.create(claritySlider, {
        start: state.DEFAULT_FILTER_RANGES.clarity,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 8
        },
        format: {
          to: function (value) {
            return clarityLabels[Math.round(value)];
          },
          from: function (value) {
            return clarityLabels.indexOf(value);
          }
        }
      });

      setTimeout(() => {
        state.markSliderInitialized('clarity');
      }, 10);
    },

    // Initialize cut grade slider
    initializeCutGradeSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for cut grade slider');
        return;
      }

      const state = window.DiamondSearchState;
      const cutGradeSlider = document.getElementById('ds-cut-grade-slider-noui');

      if (!cutGradeSlider) return;

      const cutGradeLabels = state.FILTER_LABELS.cutGrade;

      window.noUiSlider.create(cutGradeSlider, {
        start: state.DEFAULT_FILTER_RANGES.cutGrade,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 4
        },
        format: {
          to: function (value) {
            return cutGradeLabels[Math.round(value)];
          },
          from: function (value) {
            return cutGradeLabels.indexOf(value);
          }
        }
      });

      setTimeout(() => {
        state.markSliderInitialized('cutGrade');
      }, 10);
    },

    // Initialize fluorescence slider
    initializeFluorescenceSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for fluorescence slider');
        return;
      }

      const state = window.DiamondSearchState;
      const fluorescenceSlider = document.getElementById('ds-fluorescence-slider-noui');

      if (!fluorescenceSlider) return;

      const fluorescenceLabels = state.FILTER_LABELS.fluorescence;

      window.noUiSlider.create(fluorescenceSlider, {
        start: state.DEFAULT_FILTER_RANGES.fluorescence,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 4
        },
        format: {
          to: function (value) {
            return fluorescenceLabels[Math.round(value)];
          },
          from: function (value) {
            return fluorescenceLabels.indexOf(value);
          }
        }
      });

      const debounceFetch = this.createDebouncedFetch();
      fluorescenceSlider.noUiSlider.on('change', debounceFetch);

      setTimeout(() => {
        state.markSliderInitialized('fluorescence');
      }, 10);
    },

    // Initialize polish slider
    initializePolishSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for polish slider');
        return;
      }

      const state = window.DiamondSearchState;
      const polishSlider = document.getElementById('ds-polish-slider-noui');

      if (!polishSlider) return;

      const polishLabels = state.FILTER_LABELS.polish;

      window.noUiSlider.create(polishSlider, {
        start: state.DEFAULT_FILTER_RANGES.polish,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 2
        },
        format: {
          to: function (value) {
            return polishLabels[Math.round(value)];
          },
          from: function (value) {
            return polishLabels.indexOf(value);
          }
        }
      });

      const debounceFetch = this.createDebouncedFetch();
      polishSlider.noUiSlider.on('change', debounceFetch);

      setTimeout(() => {
        state.markSliderInitialized('polish');
      }, 10);
    },

    // Initialize symmetry slider
    initializeSymmetrySlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for symmetry slider');
        return;
      }

      const state = window.DiamondSearchState;
      const symmetrySlider = document.getElementById('ds-symmetry-slider-noui');

      if (!symmetrySlider) return;

      const symmetryLabels = state.FILTER_LABELS.symmetry;

             window.noUiSlider.create(symmetrySlider, {
         start: state.DEFAULT_FILTER_RANGES.symmetry,
         connect: true,
         step: 1,
         range: {
           'min': 0,
           'max': 2
         },
         format: {
           to: function (value) {
             return symmetryLabels[Math.round(value)];
           },
           from: function (value) {
             return symmetryLabels.indexOf(value);
           }
         }
       });

       const debounceFetch = this.createDebouncedFetch();
       symmetrySlider.noUiSlider.on('change', debounceFetch);

       setTimeout(() => {
         state.markSliderInitialized('symmetry');
       }, 10);
    },

    // Initialize table slider
    initializeTableSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for table slider');
        return;
      }

      const state = window.DiamondSearchState;
      const tableSlider = document.getElementById('ds-table-slider');
      const minTableInput = document.getElementById('ds-min-table');
      const maxTableInput = document.getElementById('ds-max-table');

      if (!tableSlider || !minTableInput || !maxTableInput) return;

      const debounceFetch = this.createDebouncedFetch();

      window.noUiSlider.create(tableSlider, {
        start: state.DEFAULT_FILTER_RANGES.table,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 100
        },
        format: {
          to: function (value) {
            return Math.round(value) + '%';
          },
          from: function (value) {
            return Number(value.replace('%', ''));
          }
        }
      });

      tableSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minTableInput.value = values[handle];
        } else {
          maxTableInput.value = values[handle];
        }
      });

      tableSlider.noUiSlider.on('change', debounceFetch);

      minTableInput.addEventListener('change', function () {
        const value = parseFloat(this.value.replace('%', ''));
        if (!isNaN(value)) {
          tableSlider.noUiSlider.set([value, null]);
        }
      });

      maxTableInput.addEventListener('change', function () {
        const value = parseFloat(this.value.replace('%', ''));
        if (!isNaN(value)) {
          tableSlider.noUiSlider.set([null, value]);
        }
      });

      state.markSliderInitialized('table');
    },

    // Initialize ratio slider
    initializeRatioSlider() {
      if (!window.noUiSlider || typeof window.noUiSlider.create !== 'function') {
        console.error('[DIAMOND FILTERS] noUiSlider not available for ratio slider');
        return;
      }

      const state = window.DiamondSearchState;
      const ratioSlider = document.getElementById('ds-ratio-slider');
      const minRatioInput = document.getElementById('ds-min-ratio');
      const maxRatioInput = document.getElementById('ds-max-ratio');

      if (!ratioSlider || !minRatioInput || !maxRatioInput) return;

      const debounceFetch = this.createDebouncedFetch();

      window.noUiSlider.create(ratioSlider, {
        start: state.DEFAULT_FILTER_RANGES.ratio,
        connect: true,
        step: 0.01,
        range: {
          'min': 0.8,
          'max': 3.0
        },
        format: {
          to: function (value) {
            return parseFloat(value).toFixed(2);
          },
          from: function (value) {
            return Number(value);
          }
        }
      });

      ratioSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minRatioInput.value = values[handle];
        } else {
          maxRatioInput.value = values[handle];
        }
      });

      ratioSlider.noUiSlider.on('change', debounceFetch);

      minRatioInput.addEventListener('change', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
          ratioSlider.noUiSlider.set([value, null]);
        }
      });

      maxRatioInput.addEventListener('change', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
          ratioSlider.noUiSlider.set([null, value]);
        }
      });

      state.markSliderInitialized('ratio');
    },

    // Create debounced fetch function
    createDebouncedFetch() {
      let sliderChangeTimeout;
      return () => {
        clearTimeout(sliderChangeTimeout);
        sliderChangeTimeout = setTimeout(() => {
          const state = window.DiamondSearchState;
          state.logCurrentFilters();
          window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
        }, 500);
      };
    },

    // Update certificate filter visual states
    updateCertificateFilterVisualState() {
      const state = window.DiamondSearchState;
      const certificateGroup = document.querySelector('[data-filter-group="ds-certificate"]');
      if (!certificateGroup) return;

      const activeCertificates = state.getFilter('ds-certificate');
      const isInitialState = state.getFilter('ds-certificate-initial-state');

      const buttons = certificateGroup.querySelectorAll('button');
      buttons.forEach(button => {
        const value = button.dataset.value;
        const isActive = !isInitialState && Array.isArray(activeCertificates) && activeCertificates.includes(value);
        button.dataset.active = isActive ? 'true' : 'false';
        button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });
    },

    // Setup filter button groups
    setupFilterButtonGroups() {
      const state = window.DiamondSearchState;
      const filterGroups = document.querySelectorAll('[data-filter-group]');

      filterGroups.forEach(group => {
        const groupId = group.dataset.filterGroup;
        const isMultiSelect = group.dataset.multiselect === 'true';
        const buttons = group.querySelectorAll('button');

        // Initialize filter state
        if (isMultiSelect && groupId === 'ds-certificate') {
          if (!Array.isArray(state.getFilter(groupId))) {
            state.setFilter(groupId, []);
            if (!state.getFilter('ds-certificate-initial-state')) {
              buttons.forEach(btn => {
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
            buttons.forEach(btn => {
              if (btn.dataset.active === 'true') {
                state.setFilter(groupId, btn.dataset.value);
              }
            });
          }
        }

        // Add event listeners
        buttons.forEach(button => {
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

    // Handle single select filter
    handleSingleSelectFilter(button, groupId, value) {
      const state = window.DiamondSearchState;
      const group = button.closest('[data-filter-group]');

      const previousActiveButton = group.querySelector(`button[data-active="true"]`);
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
    }
  };
}