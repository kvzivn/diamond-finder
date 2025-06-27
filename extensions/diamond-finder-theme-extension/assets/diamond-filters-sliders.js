// Diamond Filters Sliders Module
if (typeof window !== 'undefined') {
  window.DiamondFiltersSliders = {
    // Initialize all sliders
    initializeAll() {
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
      this.initializeFancyIntensitySlider();
    },

    // Initialize price slider
    initializePriceSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for price slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const priceSlider = document.getElementById('ds-price-slider');
      const minPriceInput = document.getElementById('ds-min-price');
      const maxPriceInput = document.getElementById('ds-max-price');

      if (!priceSlider || !minPriceInput || !maxPriceInput) return;

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();

      window.noUiSlider.create(priceSlider, {
        start: state.DEFAULT_FILTER_RANGES.price,
        connect: true,
        step: 100,
        margin: 1000,
        range: {
          min: 2500,
          max: 10000000,
        },
        format: {
          to: function (value) {
            return Math.round(value).toString();
          },
          from: function (value) {
            return Number(value.replace(/\s/g, ''));
          },
        },
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

      // Note: Input event handlers for price inputs are handled in diamond-ui.js
      // with debouncing to prevent immediate slider updates that cause rounding issues

      state.markSliderInitialized('price');
    },

    // Initialize carat slider
    initializeCaratSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for carat slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const caratSlider = document.getElementById('ds-carat-slider');
      const minCaratInput = document.getElementById('ds-min-carat');
      const maxCaratInput = document.getElementById('ds-max-carat');

      if (!caratSlider || !minCaratInput || !maxCaratInput) return;

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();

      // Create array of valid carat values
      const caratValues = [];
      for (let i = 0.1; i <= 10.0; i += 0.05) {
        caratValues.push(parseFloat(i.toFixed(2)));
      }
      caratValues.push(15.0, 20.0, 25.0, 30.0);

      function snapToValidCaratValue(value) {
        return caratValues.reduce((prev, curr) =>
          Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
        );
      }

      window.noUiSlider.create(caratSlider, {
        start: state.DEFAULT_FILTER_RANGES.carat,
        connect: true,
        step: 0.05,
        margin: 0.05,
        range: {
          min: 0.1,
          max: 30.0,
        },
        format: {
          to: function (value) {
            const snapped = snapToValidCaratValue(value);
            return snapped.toFixed(2);
          },
          from: function (value) {
            return Number(value);
          },
        },
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
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for colour slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const colourSlider = document.getElementById('ds-colour-slider-noui');

      if (!colourSlider) {
        console.error('[DIAMOND FILTERS] Colour slider element not found');
        return;
      }

      const colorLabels = state.FILTER_LABELS.colour;

      window.noUiSlider.create(colourSlider, {
        start: state.DEFAULT_FILTER_RANGES.colour,
        connect: true,
        step: 1,
        margin: 1,
        range: {
          min: 0,
          max: 8, // Updated to 8 since we have 9 colour levels (0-8)
        },
        format: {
          to: function (value) {
            const index = Math.round(value);
            const label = colorLabels[index];
            // Display "D" for both position 7 and 8 (D_MAX)
            return label === 'D_MAX' ? 'D' : label;
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return colorLabels.length - 1;
            }
            return colorLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      colourSlider.noUiSlider.on('change', debounceFetch);

      setTimeout(() => {
        state.markSliderInitialized('colour');
      }, 10);
    },

    // Initialize clarity slider
    initializeClaritySlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for clarity slider'
        );
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
        margin: 1,
        range: {
          min: 0,
          max: 8, // Updated to 8 since we have 9 clarity levels (0-8)
        },
        format: {
          to: function (value) {
            const index = Math.round(value);
            const label = clarityLabels[index];
            // Display "FL" for both position 7 and 8 (FL_MAX)
            return label === 'FL_MAX' ? 'FL' : label;
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return clarityLabels.length - 1;
            }
            return clarityLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      claritySlider.noUiSlider.on('change', debounceFetch);

      setTimeout(() => {
        state.markSliderInitialized('clarity');
      }, 10);
    },

    // Initialize cut grade slider
    initializeCutGradeSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for cut grade slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const cutGradeSlider = document.getElementById(
        'ds-cut-grade-slider-noui'
      );

      if (!cutGradeSlider) return;

      const cutGradeLabels = state.FILTER_LABELS.cutGrade;

      window.noUiSlider.create(cutGradeSlider, {
        start: state.DEFAULT_FILTER_RANGES.cutGrade,
        connect: true,
        step: 1,
        margin: 1,
        range: {
          min: 0,
          max: 3, // Updated to 3 since we have 4 cut grade levels (0-3)
        },
        format: {
          to: function (value) {
            const index = Math.round(value);
            const label = cutGradeLabels[index];
            // Display "Excellent" for both position 2 and 3 (Excellent_MAX)
            return label === 'Excellent_MAX' ? 'Excellent' : label;
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return cutGradeLabels.length - 1;
            }
            return cutGradeLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      cutGradeSlider.noUiSlider.on('change', debounceFetch);

      setTimeout(() => {
        state.markSliderInitialized('cutGrade');
      }, 10);
    },

    // Initialize fluorescence slider
    initializeFluorescenceSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for fluorescence slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const fluorescenceSlider = document.getElementById(
        'ds-fluorescence-slider-noui'
      );

      if (!fluorescenceSlider) return;

      const fluorescenceLabels = state.FILTER_LABELS.fluorescence;

      window.noUiSlider.create(fluorescenceSlider, {
        start: state.DEFAULT_FILTER_RANGES.fluorescence,
        connect: true,
        step: 1,
        margin: 1,
        range: {
          min: 0,
          max: 4,
        },
        format: {
          to: function (value) {
            return fluorescenceLabels[Math.round(value)];
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return fluorescenceLabels.length - 1;
            }
            return fluorescenceLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      fluorescenceSlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      fluorescenceSlider.noUiSlider.on('change', function () {
        state.markSliderChanged('fluorescence');
      });

      setTimeout(() => {
        state.markSliderInitialized('fluorescence');
      }, 10);
    },

    // Initialize polish slider
    initializePolishSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for polish slider'
        );
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
        margin: 1,
        range: {
          min: 0,
          max: 2,
        },
        format: {
          to: function (value) {
            return polishLabels[Math.round(value)];
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return polishLabels.length - 1;
            }
            return polishLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      polishSlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      polishSlider.noUiSlider.on('change', function () {
        state.markSliderChanged('polish');
      });

      setTimeout(() => {
        state.markSliderInitialized('polish');
      }, 10);
    },

    // Initialize symmetry slider
    initializeSymmetrySlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for symmetry slider'
        );
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
        margin: 1,
        range: {
          min: 0,
          max: 2,
        },
        format: {
          to: function (value) {
            return symmetryLabels[Math.round(value)];
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return symmetryLabels.length - 1;
            }
            return symmetryLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      symmetrySlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      symmetrySlider.noUiSlider.on('change', function () {
        state.markSliderChanged('symmetry');
      });

      setTimeout(() => {
        state.markSliderInitialized('symmetry');
      }, 10);
    },

    // Initialize table slider
    initializeTableSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for table slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const tableSlider = document.getElementById('ds-table-slider');
      const minTableInput = document.getElementById('ds-min-table');
      const maxTableInput = document.getElementById('ds-max-table');

      if (!tableSlider || !minTableInput || !maxTableInput) return;

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();

      window.noUiSlider.create(tableSlider, {
        start: state.DEFAULT_FILTER_RANGES.table,
        connect: true,
        step: 1,
        margin: 1,
        range: {
          min: 0,
          max: 100,
        },
        format: {
          to: function (value) {
            return Math.round(value) + '%';
          },
          from: function (value) {
            return Number(value.replace('%', ''));
          },
        },
      });

      tableSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minTableInput.value = values[handle];
        } else {
          maxTableInput.value = values[handle];
        }
      });

      tableSlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      tableSlider.noUiSlider.on('change', function () {
        state.markSliderChanged('table');
      });

      minTableInput.addEventListener('change', function () {
        const value = parseFloat(this.value.replace('%', ''));
        if (!isNaN(value)) {
          tableSlider.noUiSlider.set([value, null]);
          state.markSliderChanged('table');
        }
      });

      maxTableInput.addEventListener('change', function () {
        const value = parseFloat(this.value.replace('%', ''));
        if (!isNaN(value)) {
          tableSlider.noUiSlider.set([null, value]);
          state.markSliderChanged('table');
        }
      });

      state.markSliderInitialized('table');
    },

    // Initialize ratio slider
    initializeRatioSlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for ratio slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const ratioSlider = document.getElementById('ds-ratio-slider');
      const minRatioInput = document.getElementById('ds-min-ratio');
      const maxRatioInput = document.getElementById('ds-max-ratio');

      if (!ratioSlider || !minRatioInput || !maxRatioInput) return;

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();

      window.noUiSlider.create(ratioSlider, {
        start: state.DEFAULT_FILTER_RANGES.ratio,
        connect: true,
        step: 0.01,
        margin: 0.01,
        range: {
          min: 0.8,
          max: 3.0,
        },
        format: {
          to: function (value) {
            return parseFloat(value).toFixed(2);
          },
          from: function (value) {
            return Number(value);
          },
        },
      });

      ratioSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minRatioInput.value = values[handle];
        } else {
          maxRatioInput.value = values[handle];
        }
      });

      ratioSlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      ratioSlider.noUiSlider.on('change', function () {
        state.markSliderChanged('ratio');
      });

      minRatioInput.addEventListener('change', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
          ratioSlider.noUiSlider.set([value, null]);
          state.markSliderChanged('ratio');
        }
      });

      maxRatioInput.addEventListener('change', function () {
        const value = parseFloat(this.value);
        if (!isNaN(value)) {
          ratioSlider.noUiSlider.set([null, value]);
          state.markSliderChanged('ratio');
        }
      });

      state.markSliderInitialized('ratio');
    },

    // Initialize fancy intensity slider
    initializeFancyIntensitySlider() {
      if (
        !window.noUiSlider ||
        typeof window.noUiSlider.create !== 'function'
      ) {
        console.error(
          '[DIAMOND FILTERS] noUiSlider not available for fancy intensity slider'
        );
        return;
      }

      const state = window.DiamondSearchState;
      const fancyIntensitySlider = document.getElementById(
        'ds-fancy-intensity-slider'
      );

      if (!fancyIntensitySlider) return;

      const intensityLabels = state.FILTER_LABELS.fancyIntensity;

      window.noUiSlider.create(fancyIntensitySlider, {
        start: state.DEFAULT_FILTER_RANGES.fancyIntensity, // Use default range from state
        connect: true,
        step: 1,
        margin: 1,
        range: {
          min: 0,
          max: 6, // Updated to 6 since we have 7 intensity levels (0-6)
        },
        format: {
          to: function (value) {
            const index = Math.round(value);
            const label = intensityLabels[index];
            // Display "Dark" for both position 5 and 6 (Dark_MAX)
            return label === 'Dark_MAX' ? 'Dark' : label;
          },
          from: function (value) {
            if (value.endsWith('_MAX')) {
              return intensityLabels.length - 1;
            }
            return intensityLabels.indexOf(value);
          },
        },
      });

      const debounceFetch = window.DiamondFiltersUtils.createDebouncedFetch();
      fancyIntensitySlider.noUiSlider.on('change', debounceFetch);

      // Track when user changes the slider
      fancyIntensitySlider.noUiSlider.on('change', function () {
        state.markSliderChanged('fancyIntensity');
      });

      setTimeout(() => {
        state.markSliderInitialized('fancyIntensity');
      }, 10);
    },
  };
}
