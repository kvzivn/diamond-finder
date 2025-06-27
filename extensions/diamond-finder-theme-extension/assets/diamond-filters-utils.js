// Diamond Filters Utilities Module
if (typeof window !== 'undefined') {
  window.DiamondFiltersUtils = {
    // Wait for noUiSlider to be available
    waitForNoUiSlider(callback, maxAttempts = 100) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (
          typeof window !== 'undefined' &&
          window.noUiSlider &&
          typeof window.noUiSlider.create === 'function'
        ) {
          clearInterval(checkInterval);
          callback();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(
            '[DIAMOND FILTERS] noUiSlider library failed to load after',
            maxAttempts * 50,
            'ms'
          );
        }
      }, 50);
    },

    // Create debounced fetch function
    createDebouncedFetch() {
      let sliderChangeTimeout;
      return () => {
        clearTimeout(sliderChangeTimeout);
        sliderChangeTimeout = setTimeout(() => {
          const state = window.DiamondSearchState;
          state.logCurrentFilters();
          window.DiamondAPI.fetchDiamondData(
            1,
            state.paginationInfo.limit || 24
          );
        }, 500);
      };
    },

    // Get current slider values
    getSliderValues(useInitialDefaults = false) {
      const state = window.DiamondSearchState;

      if (useInitialDefaults) {
        return {
          price: state.DEFAULT_FILTER_RANGES.price.map(String),
          carat: state.DEFAULT_FILTER_RANGES.carat.map((val) => val.toFixed(2)),
          colour: state.DEFAULT_FILTER_RANGES.colour,
          clarity: state.DEFAULT_FILTER_RANGES.clarity,
          cutGrade: state.DEFAULT_FILTER_RANGES.cutGrade,
          fluorescence: state.DEFAULT_FILTER_RANGES.fluorescence,
          polish: state.DEFAULT_FILTER_RANGES.polish,
          symmetry: state.DEFAULT_FILTER_RANGES.symmetry,
          table: state.DEFAULT_FILTER_RANGES.table.map((val) => val + '%'),
          ratio: state.DEFAULT_FILTER_RANGES.ratio.map((val) => val.toFixed(2)),
        };
      }

      const values = {};

      // Get price values
      const priceSliderEl = document.getElementById('ds-price-slider');
      if (priceSliderEl && priceSliderEl.noUiSlider) {
        values.price = priceSliderEl.noUiSlider.get();
      }

      // Get carat values
      const caratSliderEl = document.getElementById('ds-carat-slider');
      if (caratSliderEl && caratSliderEl.noUiSlider) {
        values.carat = caratSliderEl.noUiSlider.get();
      }

      // Get colour values
      const colourSliderEl = document.getElementById('ds-colour-slider-noui');
      if (colourSliderEl && colourSliderEl.noUiSlider) {
        values.colour = this._getGradeSliderValues(colourSliderEl, 'colour');
      }

      // Get clarity values
      const claritySliderEl = document.getElementById('ds-clarity-slider-noui');
      if (claritySliderEl && claritySliderEl.noUiSlider) {
        values.clarity = this._getGradeSliderValues(claritySliderEl, 'clarity');
      }

      // Get cut grade values
      const cutGradeSliderEl = document.getElementById(
        'ds-cut-grade-slider-noui'
      );
      if (cutGradeSliderEl && cutGradeSliderEl.noUiSlider) {
        values.cutGrade = this._getGradeSliderValues(
          cutGradeSliderEl,
          'cutGrade'
        );
      }

      // Get fluorescence values
      const fluorescenceSliderEl = document.getElementById(
        'ds-fluorescence-slider-noui'
      );
      if (fluorescenceSliderEl && fluorescenceSliderEl.noUiSlider) {
        values.fluorescence = this._getGradeSliderValues(
          fluorescenceSliderEl,
          'fluorescence'
        );
      }

      // Get polish values
      const polishSliderEl = document.getElementById('ds-polish-slider-noui');
      if (polishSliderEl && polishSliderEl.noUiSlider) {
        values.polish = this._getGradeSliderValues(polishSliderEl, 'polish');
      }

      // Get symmetry values
      const symmetrySliderEl = document.getElementById(
        'ds-symmetry-slider-noui'
      );
      if (symmetrySliderEl && symmetrySliderEl.noUiSlider) {
        values.symmetry = this._getGradeSliderValues(
          symmetrySliderEl,
          'symmetry'
        );
      }

      // Get table values
      const tableSliderEl = document.getElementById('ds-table-slider');
      if (tableSliderEl && tableSliderEl.noUiSlider) {
        values.table = tableSliderEl.noUiSlider.get();
      }

      // Get ratio values
      const ratioSliderEl = document.getElementById('ds-ratio-slider');
      if (ratioSliderEl && ratioSliderEl.noUiSlider) {
        values.ratio = ratioSliderEl.noUiSlider.get();
      }

      // Get fancy colour selections from state
      const fancyColours = state.getFilter('ds-fancy-colour');
      if (
        fancyColours &&
        Array.isArray(fancyColours) &&
        fancyColours.length > 0
      ) {
        values.fancyColours = fancyColours;
      }

      // Get fancy intensity values
      const fancyIntensitySliderEl = document.getElementById(
        'ds-fancy-intensity-slider'
      );
      if (fancyIntensitySliderEl && fancyIntensitySliderEl.noUiSlider) {
        values.fancyIntensity = this._getGradeSliderValues(
          fancyIntensitySliderEl,
          'fancyIntensity'
        );
      }

      // Get active colour tab
      const activeColourTab = document.querySelector(
        '#ds-colour-tab-white[data-active="true"], #ds-colour-tab-fancy[data-active="true"]'
      );
      if (activeColourTab) {
        values.colourType = activeColourTab.dataset.tab;
      } else {
        values.colourType = 'white';
      }

      return values;
    },

    // Helper to get grade slider values with proper handling
    _getGradeSliderValues(sliderEl, filterType) {
      const state = window.DiamondSearchState;
      const labels = state.FILTER_LABELS[filterType];
      const handles = sliderEl.noUiSlider.get(true);
      const startIndex = Math.round(handles[0]);
      const endIndex = Math.round(handles[1]);
      const maxIndex = labels.length - 1;

      if (startIndex === endIndex) {
        return [labels[startIndex]];
      } else {
        // Special case: if both thumbs are at or very close to the max position,
        // user wants only the highest grade
        if (endIndex === maxIndex && startIndex >= maxIndex - 1) {
          return [labels[maxIndex], labels[maxIndex] + '_MAX'];
        } else if (endIndex === maxIndex) {
          // Right thumb at max but left thumb not close to it
          const minValue = labels[startIndex];
          const maxValue = labels[endIndex] + '_MAX';
          return [minValue, maxValue];
        } else {
          // Normal range case - make the max exclusive by subtracting 1
          const minValue = labels[startIndex];
          const adjustedEndIndex = endIndex - 1;

          if (adjustedEndIndex < startIndex) {
            // If adjusted end is less than start, we want only the start value
            return [minValue];
          } else if (adjustedEndIndex === startIndex) {
            // If adjusted end equals start, we want only that value
            return [minValue];
          } else {
            // Normal range with exclusive end
            return [minValue, labels[adjustedEndIndex]];
          }
        }
      }
    },
  };
}
