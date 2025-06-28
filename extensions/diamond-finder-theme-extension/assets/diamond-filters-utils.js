// Diamond Filters Utilities Module
if (typeof window !== 'undefined') {
  window.DiamondFiltersUtils = {
    // Wait for noUiSlider to be available
    waitForNoUiSlider(callback, maxAttempts = 200) {
      let attempts = 0;
      const checkInterval = setInterval(() => {
        attempts++;
        if (
          typeof window !== 'undefined' &&
          window.noUiSlider &&
          typeof window.noUiSlider.create === 'function'
        ) {
          clearInterval(checkInterval);
          console.log(
            '[DIAMOND FILTERS] noUiSlider loaded successfully after',
            attempts * 50,
            'ms'
          );
          callback();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.error(
            '[DIAMOND FILTERS] noUiSlider library failed to load after',
            maxAttempts * 50,
            'ms - this will cause slider initialization to fail'
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

      // Special handling for cutGrade filter
      if (filterType === 'cutGrade') {
        // For cut grade, we need special logic to handle Excellent_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at Excellent_MAX position - return only Excellent
            return ['Excellent', 'Excellent'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at Excellent_MAX
          if (startIndex === maxIndex - 1) {
            // Left at Excellent, right at Excellent_MAX - only Excellent
            return ['Excellent', 'Excellent'];
          } else {
            // Include all grades from start to Excellent (inclusive)
            return [labels[startIndex], 'Excellent'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for clarity filter
      if (filterType === 'clarity') {
        // For clarity, we need special logic to handle FL_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at FL_MAX position - return only FL
            return ['FL', 'FL'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at FL_MAX
          if (startIndex === maxIndex - 1) {
            // Left at FL, right at FL_MAX - only FL
            return ['FL', 'FL'];
          } else {
            // Include all grades from start to FL (inclusive)
            return [labels[startIndex], 'FL'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for colour filter
      if (filterType === 'colour') {
        // For colour, we need special logic to handle D_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at D_MAX position - return only D
            return ['D', 'D'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at D_MAX
          if (startIndex === maxIndex - 1) {
            // Left at D, right at D_MAX - only D
            return ['D', 'D'];
          } else {
            // Include all grades from start to D (inclusive)
            return [labels[startIndex], 'D'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for fancyIntensity filter
      if (filterType === 'fancyIntensity') {
        // For fancy intensity, we need special logic to handle Dark_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at Dark_MAX position - return only Dark
            return ['Dark', 'Dark'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at Dark_MAX
          if (startIndex === maxIndex - 1) {
            // Left at Dark, right at Dark_MAX - only Dark
            return ['Dark', 'Dark'];
          } else {
            // Include all grades from start to Dark (inclusive)
            return [labels[startIndex], 'Dark'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for polish filter
      if (filterType === 'polish') {
        // For polish, we need special logic to handle Excellent_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at Excellent_MAX position - return only Excellent
            return ['Excellent', 'Excellent'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at Excellent_MAX
          if (startIndex === maxIndex - 1) {
            // Left at Excellent, right at Excellent_MAX - only Excellent
            return ['Excellent', 'Excellent'];
          } else {
            // Include all grades from start to Excellent (inclusive)
            return [labels[startIndex], 'Excellent'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for symmetry filter
      if (filterType === 'symmetry') {
        // For symmetry, we need special logic to handle Excellent_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at Excellent_MAX position - return only Excellent
            return ['Excellent', 'Excellent'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at Excellent_MAX
          if (startIndex === maxIndex - 1) {
            // Left at Excellent, right at Excellent_MAX - only Excellent
            return ['Excellent', 'Excellent'];
          } else {
            // Include all grades from start to Excellent (inclusive)
            return [labels[startIndex], 'Excellent'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Special handling for fluorescence filter
      if (filterType === 'fluorescence') {
        // For fluorescence, we need special logic to handle Very Strong_MAX
        if (startIndex === endIndex) {
          // Both thumbs at same position
          if (endIndex === maxIndex) {
            // Both at Very Strong_MAX position - return only Very Strong
            return ['Very Strong', 'Very Strong'];
          }
          return [labels[startIndex], labels[startIndex]];
        } else if (endIndex === maxIndex) {
          // Right thumb at Very Strong_MAX
          if (startIndex === maxIndex - 1) {
            // Left at Very Strong, right at Very Strong_MAX - only Very Strong
            return ['Very Strong', 'Very Strong'];
          } else {
            // Include all grades from start to Very Strong (inclusive)
            return [labels[startIndex], 'Very Strong'];
          }
        } else {
          // Right thumb not at max - exclude the end position
          if (endIndex <= startIndex) {
            return [labels[startIndex], labels[startIndex]];
          }
          return [labels[startIndex], labels[endIndex - 1]];
        }
      }

      // Original logic for other filter types
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
