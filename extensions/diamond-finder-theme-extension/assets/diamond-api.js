// Diamond Search API Module
if (typeof window !== 'undefined') {
  window.DiamondAPI = {
    // Build query string from current filters
    buildFilterQueryString() {
      const params = new URLSearchParams();
      const state = window.DiamondSearchState;

      // Add shape filter - default to ROUND if no shape is selected yet
      if (state.getFilter('ds-shape')) {
        params.append('shape', state.getFilter('ds-shape'));
      } else if (!state.initialLoadComplete) {
        params.append('shape', 'ROUND');
      }

      // Add type filter
      if (state.getFilter('ds-type')) {
        // Map display values to API values
        const typeValue = state.getFilter('ds-type');
        const apiTypeValue =
          typeValue === 'Natural'
            ? 'natural'
            : typeValue === 'Lab Grown'
              ? 'lab'
              : typeValue;
        params.append('type', apiTypeValue);
      }

      // Add sorting parameter
      if (state.currentSort) {
        params.append('sort', state.currentSort);
      }

      // Add price filters from sliders
      const priceSliderEl = document.getElementById('ds-price-slider');
      if (priceSliderEl && priceSliderEl.noUiSlider) {
        const priceValues = priceSliderEl.noUiSlider.get();
        if (priceValues && priceValues.length === 2) {
          const minPrice = parseFloat(
            String(priceValues[0]).replace(/\s/g, '')
          );
          const maxPrice = parseFloat(
            String(priceValues[1]).replace(/\s/g, '')
          );
          if (!isNaN(minPrice))
            params.append('minPriceSek', minPrice.toString());
          if (!isNaN(maxPrice))
            params.append('maxPriceSek', maxPrice.toString());
        }
      } else {
        // Fallback: Always apply default minimum price filter of 2500 SEK when slider isn't available
        params.append('minPriceSek', '2500');
      }

      // Add carat filters from sliders
      const caratSliderEl = document.getElementById('ds-carat-slider');
      if (caratSliderEl && caratSliderEl.noUiSlider) {
        const caratValues = caratSliderEl.noUiSlider.get();
        if (caratValues && caratValues.length === 2) {
          const minCarat = parseFloat(caratValues[0]);
          const maxCarat = parseFloat(caratValues[1]);
          if (!isNaN(minCarat)) params.append('minCarat', minCarat.toString());
          if (!isNaN(maxCarat)) params.append('maxCarat', maxCarat.toString());
        }
      } else {
        // Fallback: Always apply default carat filter when slider isn't available
        const defaultCaratRange = state.DEFAULT_FILTER_RANGES.carat;
        params.append('minCarat', defaultCaratRange[0].toString());
        params.append('maxCarat', defaultCaratRange[1].toString());
      }

      // Add colour filters from sliders
      const filterValues = window.DiamondFilters.getSliderValues();

      if (
        (filterValues.colourType === 'white' || !filterValues.colourType) &&
        (!filterValues.fancyColours || filterValues.fancyColours.length === 0)
      ) {
        // Apply white color filters when white tab is active or no tab is specified
        const colourSliderEl = document.getElementById('ds-colour-slider-noui');
        if (colourSliderEl && colourSliderEl.noUiSlider) {
          const colourValues = window.DiamondFilters.getSliderValues().colour;
          if (colourValues && colourValues.length > 0) {
            const minColour = colourValues[0];
            const maxColour = colourValues[colourValues.length - 1];

            if (minColour === maxColour) {
              // Single value selected - only send one parameter
              params.append('minColour', minColour);
              params.append('maxColour', minColour);
            } else {
              // Range selected
              if (minColour) params.append('minColour', minColour);
              if (maxColour) params.append('maxColour', maxColour);
            }
          } else {
            // Apply default white color range when slider isn't ready
            params.append('minColour', 'K');
            params.append('maxColour', 'D');
          }
        } else {
          // Apply default white color range when slider isn't initialized
          params.append('minColour', 'K');
          params.append('maxColour', 'D');
        }
      } else if (filterValues.colourType === 'fancy') {
        if (filterValues.fancyColours && filterValues.fancyColours.length > 0) {
          // Apply specific fancy color filters when colors are selected
          const fancyColorParam = filterValues.fancyColours.join(',');
          params.append('fancyColours', fancyColorParam);

          // Only add fancy intensity range when specific colors are selected AND the user has actually moved the intensity slider
          if (
            filterValues.fancyIntensity &&
            filterValues.fancyIntensity.length > 0 &&
            state.hasSliderChanged('fancyIntensity')
          ) {
            const minIntensity = filterValues.fancyIntensity[0];
            const maxIntensity =
              filterValues.fancyIntensity[
                filterValues.fancyIntensity.length - 1
              ];

            // Check if the intensity slider is at its default full range
            // The default range is from 'Light' to 'Dark' after the slider formats it
            const isFullRange =
              minIntensity === 'Light' && maxIntensity === 'Dark';

            // Only apply intensity filters if user has specifically narrowed the range
            if (!isFullRange) {
              if (minIntensity) {
                params.append('minFancyIntensity', minIntensity);
              }
              if (maxIntensity && maxIntensity !== minIntensity) {
                params.append('maxFancyIntensity', maxIntensity);
              }
            }
          }
        } else {
          // Apply "all fancy colors" filter when fancy tab is active but no specific colors selected
          params.append('fancyColours', 'ALL_FANCY');

          // Also check for intensity filters when showing ALL_FANCY
          if (
            filterValues.fancyIntensity &&
            filterValues.fancyIntensity.length > 0 &&
            state.hasSliderChanged('fancyIntensity')
          ) {
            const minIntensity = filterValues.fancyIntensity[0];
            const maxIntensity =
              filterValues.fancyIntensity[
                filterValues.fancyIntensity.length - 1
              ];

            // Check if the intensity slider is at its default full range
            // The default range is from 'Light' to 'Dark' after the slider formats it
            const isFullRange =
              minIntensity === 'Light' && maxIntensity === 'Dark';

            // Only apply intensity filters if user has specifically narrowed the range
            if (!isFullRange) {
              if (minIntensity) {
                params.append('minFancyIntensity', minIntensity);
              }
              if (maxIntensity && maxIntensity !== minIntensity) {
                params.append('maxFancyIntensity', maxIntensity);
              }
            }
          }
        }
      }

      // Add clarity filters from sliders
      const claritySliderEl = document.getElementById('ds-clarity-slider-noui');
      if (claritySliderEl && claritySliderEl.noUiSlider) {
        const clarityValues = window.DiamondFilters.getSliderValues().clarity;
        if (clarityValues && clarityValues.length > 0) {
          const minClarity = clarityValues[0];
          const maxClarity = clarityValues[clarityValues.length - 1];

          if (minClarity === maxClarity) {
            // Single value selected - only send one parameter
            params.append('minClarity', minClarity);
            params.append('maxClarity', minClarity);
          } else {
            // Range selected
            if (minClarity) params.append('minClarity', minClarity);
            if (maxClarity) params.append('maxClarity', maxClarity);
          }
        }
      }

      // Add cut grade filters from sliders
      const cutGradeSliderEl = document.getElementById(
        'ds-cut-grade-slider-noui'
      );
      if (cutGradeSliderEl && cutGradeSliderEl.noUiSlider) {
        const cutGradeValues = window.DiamondFilters.getSliderValues().cutGrade;
        if (cutGradeValues && cutGradeValues.length > 0) {
          const minCutGrade = cutGradeValues[0];
          const maxCutGrade = cutGradeValues[cutGradeValues.length - 1];

          if (minCutGrade === maxCutGrade) {
            // Single value selected
            params.append('minCutGrade', minCutGrade);
            params.append('maxCutGrade', minCutGrade);
          } else {
            // Range selected
            if (minCutGrade) params.append('minCutGrade', minCutGrade);
            if (maxCutGrade) params.append('maxCutGrade', maxCutGrade);
          }
        }
      }

      // Add certificate filters
      const certificates = state.getFilter('ds-certificate');
      if (certificates) {
        if (Array.isArray(certificates) && certificates.length > 0) {
          params.append('gradingLab', certificates.join(','));
        } else if (certificates.length === 0) {
          params.append('gradingLab', 'NONE');
        }
      } else if (!state.initialLoadComplete) {
        params.append('gradingLab', 'GIA,IGI,HRD');
      } else {
        params.append('gradingLab', 'NONE');
      }

      // Add fluorescence filters from sliders
      const fluorescenceSliderEl = document.getElementById(
        'ds-fluorescence-slider-noui'
      );
      if (
        fluorescenceSliderEl &&
        fluorescenceSliderEl.noUiSlider &&
        state.hasSliderChanged('fluorescence')
      ) {
        const fluorescenceValues =
          window.DiamondFilters.getSliderValues().fluorescence;
        if (fluorescenceValues && fluorescenceValues.length > 0) {
          const minFluorescence = fluorescenceValues[0];
          const maxFluorescence =
            fluorescenceValues[fluorescenceValues.length - 1];

          if (minFluorescence === maxFluorescence) {
            // Single value selected
            params.append('minFluorescence', minFluorescence);
            params.append('maxFluorescence', minFluorescence);
          } else {
            // Range selected
            if (minFluorescence)
              params.append('minFluorescence', minFluorescence);
            if (maxFluorescence)
              params.append('maxFluorescence', maxFluorescence);
          }
        }
      }

      // Add polish filters from sliders
      const polishSliderEl = document.getElementById('ds-polish-slider-noui');
      if (
        polishSliderEl &&
        polishSliderEl.noUiSlider &&
        state.hasSliderChanged('polish')
      ) {
        const polishValues = window.DiamondFilters.getSliderValues().polish;
        if (polishValues && polishValues.length > 0) {
          const minPolish = polishValues[0];
          const maxPolish = polishValues[polishValues.length - 1];

          if (minPolish === maxPolish) {
            // Single value selected
            params.append('minPolish', minPolish);
            params.append('maxPolish', minPolish);
          } else {
            // Range selected
            if (minPolish) params.append('minPolish', minPolish);
            if (maxPolish) params.append('maxPolish', maxPolish);
          }
        }
      }

      // Add symmetry filters from sliders
      const symmetrySliderEl = document.getElementById(
        'ds-symmetry-slider-noui'
      );
      if (
        symmetrySliderEl &&
        symmetrySliderEl.noUiSlider &&
        state.hasSliderChanged('symmetry')
      ) {
        const symmetryValues = window.DiamondFilters.getSliderValues().symmetry;
        if (symmetryValues && symmetryValues.length > 0) {
          const minSymmetry = symmetryValues[0];
          const maxSymmetry = symmetryValues[symmetryValues.length - 1];

          if (minSymmetry === maxSymmetry) {
            // Single value selected
            params.append('minSymmetry', minSymmetry);
            params.append('maxSymmetry', minSymmetry);
          } else {
            // Range selected
            if (minSymmetry) params.append('minSymmetry', minSymmetry);
            if (maxSymmetry) params.append('maxSymmetry', maxSymmetry);
          }
        }
      }

      // Add table filters from sliders
      const tableSliderEl = document.getElementById('ds-table-slider');
      if (
        tableSliderEl &&
        tableSliderEl.noUiSlider &&
        state.hasSliderChanged('table')
      ) {
        const tableValues = tableSliderEl.noUiSlider.get();
        if (tableValues && tableValues.length === 2) {
          const minTable = parseFloat(tableValues[0]);
          const maxTable = parseFloat(tableValues[1]);
          if (!isNaN(minTable)) params.append('minTable', minTable.toString());
          if (!isNaN(maxTable)) params.append('maxTable', maxTable.toString());
        }
      }

      // Add ratio filters from sliders
      const ratioSliderEl = document.getElementById('ds-ratio-slider');
      if (
        ratioSliderEl &&
        ratioSliderEl.noUiSlider &&
        state.hasSliderChanged('ratio')
      ) {
        const ratioValues = ratioSliderEl.noUiSlider.get();
        if (ratioValues && ratioValues.length === 2) {
          const minRatio = parseFloat(ratioValues[0]);
          const maxRatio = parseFloat(ratioValues[1]);
          if (!isNaN(minRatio)) params.append('minRatio', minRatio.toString());
          if (!isNaN(maxRatio)) params.append('maxRatio', maxRatio.toString());
        }
      }

      // Log all filters being applied
      this.logAppliedFilters(params);

      return params.toString();
    },

    // Log all filters being applied to the API
    logAppliedFilters(params) {
      // Group filters by type with min/max pairs together
      const groupedFilters = {
        basic: {
          shape: null,
          type: null,
          price: {},
          carat: {},
          colour: {},
          clarity: {},
          cutGrade: {},
          gradingLab: null,
          fancyColours: null,
          fancyIntensity: {},
        },
        advanced: {
          fluorescence: {},
          polish: {},
          symmetry: {},
          table: {},
          ratio: {},
        },
        other: {
          sort: null,
        },
      };

      // Process all parameters and group them
      for (const [key, value] of params.entries()) {
        // Basic filters
        if (key === 'shape') groupedFilters.basic.shape = value;
        else if (key === 'type') groupedFilters.basic.type = value;
        else if (key === 'minPriceSek') groupedFilters.basic.price.min = value;
        else if (key === 'maxPriceSek') groupedFilters.basic.price.max = value;
        else if (key === 'minCarat') groupedFilters.basic.carat.min = value;
        else if (key === 'maxCarat') groupedFilters.basic.carat.max = value;
        else if (key === 'minColour') groupedFilters.basic.colour.min = value;
        else if (key === 'maxColour') groupedFilters.basic.colour.max = value;
        else if (key === 'minClarity') groupedFilters.basic.clarity.min = value;
        else if (key === 'maxClarity') groupedFilters.basic.clarity.max = value;
        else if (key === 'minCutGrade')
          groupedFilters.basic.cutGrade.min = value;
        else if (key === 'maxCutGrade')
          groupedFilters.basic.cutGrade.max = value;
        else if (key === 'gradingLab') groupedFilters.basic.gradingLab = value;
        else if (key === 'fancyColours')
          groupedFilters.basic.fancyColours = value;
        else if (key === 'minFancyIntensity')
          groupedFilters.basic.fancyIntensity.min = value;
        else if (key === 'maxFancyIntensity')
          groupedFilters.basic.fancyIntensity.max = value;
        // Advanced filters
        else if (key === 'minFluorescence')
          groupedFilters.advanced.fluorescence.min = value;
        else if (key === 'maxFluorescence')
          groupedFilters.advanced.fluorescence.max = value;
        else if (key === 'minPolish')
          groupedFilters.advanced.polish.min = value;
        else if (key === 'maxPolish')
          groupedFilters.advanced.polish.max = value;
        else if (key === 'minSymmetry')
          groupedFilters.advanced.symmetry.min = value;
        else if (key === 'maxSymmetry')
          groupedFilters.advanced.symmetry.max = value;
        else if (key === 'minTable') groupedFilters.advanced.table.min = value;
        else if (key === 'maxTable') groupedFilters.advanced.table.max = value;
        else if (key === 'minRatio') groupedFilters.advanced.ratio.min = value;
        else if (key === 'maxRatio') groupedFilters.advanced.ratio.max = value;
        // Other filters
        else if (key === 'sort') groupedFilters.other.sort = value;
        else groupedFilters.other[key] = value;
      }

      // Clean up empty objects and format for display
      const formatFilters = (filters) => {
        const formatted = {};
        for (const [key, value] of Object.entries(filters)) {
          if (
            value &&
            typeof value === 'object' &&
            Object.keys(value).length > 0
          ) {
            // Format min/max pairs
            if (value.min && value.max) {
              formatted[key] =
                value.min === value.max
                  ? value.min
                  : `${value.min} - ${value.max}`;
            } else if (value.min) {
              formatted[key] = `${value.min}+`;
            } else if (value.max) {
              formatted[key] = `up to ${value.max}`;
            }
          } else if (value !== null && value !== undefined) {
            formatted[key] = value;
          }
        }
        return formatted;
      };

      const activeBasicFilters = formatFilters(groupedFilters.basic);
      const activeAdvancedFilters = formatFilters(groupedFilters.advanced);
      const activeOtherFilters = formatFilters(groupedFilters.other);

      // Create summary for console
      const totalFilters = params
        .toString()
        .split('&')
        .filter((p) => p).length;

      console.log(`[FILTERS APPLIED] ${totalFilters} filters active`);

      // Log each category with a cleaner format
      if (Object.keys(activeBasicFilters).length > 0) {
        console.log('📊 Basic Filters:', activeBasicFilters);
      }

      if (Object.keys(activeAdvancedFilters).length > 0) {
        console.log('⚙️  Advanced Filters:', activeAdvancedFilters);
      }

      if (Object.keys(activeOtherFilters).length > 0) {
        console.log('🔧 Other:', activeOtherFilters);
      }

      // Show the full query string in a collapsed format
      console.groupCollapsed('🔗 Full Query String');
      console.log(params.toString());
      console.groupEnd();
    },

    // Fetch diamond data from API
    async fetchDiamondData(page = 1, limit = 24, isLoadMore = false) {
      const state = window.DiamondSearchState;
      const gridArea = document.getElementById('diamond-grid-area');
      const initialLoadingSpinner = document.getElementById(
        'diamond-initial-loading'
      );

      // Track if this is the initial load (before initialLoadComplete is set)
      const isInitialLoad = !state.initialLoadComplete && !isLoadMore;

      if (!isLoadMore) {
        // Show initial loading spinner only for the very first load
        if (isInitialLoad && initialLoadingSpinner) {
          initialLoadingSpinner.classList.remove('tw-hidden');
          if (gridArea) {
            gridArea.classList.add('tw-hidden');
          }
        } else {
          // For filter loads, use opacity effect
          if (gridArea) {
            gridArea.classList.add('tw-opacity-60');
          }
        }
      } else {
        state.isLoadingMore = true;
        window.DiamondUI?.showLoadMoreIndicator(true);
      }

      try {
        const filterParams = this.buildFilterQueryString();

        const baseUrl = `/apps/api/diamonds/all?page=${page}&limit=${limit}`;
        const url = filterParams ? `${baseUrl}&${filterParams}` : baseUrl;

        const response = await fetch(url);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, message: ${errorText}`
          );
        }

        const data = await response.json();
        const newDiamonds = data.diamonds || [];
        console.log('[NEWLY FETCHED DIAMONDS]', newDiamonds);

        // Update state
        state.setDiamonds(newDiamonds, isLoadMore);
        state.setPaginationInfo({
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalDiamonds: data.totalDiamonds,
          limit: data.limit,
          totalNaturalDiamonds: data.totalNaturalDiamonds,
          totalLabDiamonds: data.totalLabDiamonds,
        });

        // Filter out bad data
        state.allDiamonds = state.allDiamonds.filter(
          (d) => d.cut && d.cut.toLowerCase() !== 'cut'
        );

        // Render diamonds
        if (window.DiamondRenderer) {
          window.DiamondRenderer.renderDiamonds(state.allDiamonds);
        }
      } catch (error) {
        console.error('Failed to fetch diamond data:', error);

        if (gridArea && !isLoadMore) {
          // Handle error for initial load vs filter load
          if (isInitialLoad && initialLoadingSpinner) {
            // Hide spinner and show error in grid area for initial load
            initialLoadingSpinner.classList.add('tw-hidden');
            gridArea.classList.remove('tw-hidden');
            gridArea.innerHTML =
              '<p class="tw-text-center tw-py-10">Kunde inte hämta diamanter. Försök igen senare.</p>';
          } else {
            // Handle error for filter load
            gridArea.classList.remove('tw-opacity-60');
            gridArea.innerHTML =
              '<p class="tw-text-center tw-py-10">Kunde inte hämta diamanter. Försök igen senare.</p>';
          }
        }
      } finally {
        if (isLoadMore) {
          state.isLoadingMore = false;
          window.DiamondUI?.showLoadMoreIndicator(false);
        } else {
          // Hide initial loading spinner and show grid area
          if (isInitialLoad && initialLoadingSpinner) {
            initialLoadingSpinner.classList.add('tw-hidden');
            if (gridArea) {
              gridArea.classList.remove('tw-hidden');
            }
          } else {
            // For filter loads, remove opacity
            if (gridArea) {
              gridArea.classList.remove('tw-opacity-60');
            }
          }
        }
      }
    },
  };
}
