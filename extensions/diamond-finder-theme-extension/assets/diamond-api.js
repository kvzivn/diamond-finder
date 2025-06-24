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
        params.append('type', state.getFilter('ds-type'));
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
      }

      // Add colour filters from sliders
      const filterValues = window.DiamondFilters.getSliderValues();

      console.log(
        '[DIAMOND API DEBUG] filterValues.colourType:',
        filterValues.colourType
      );
      console.log(
        '[DIAMOND API DEBUG] filterValues.fancyColours:',
        filterValues.fancyColours
      );

      if (filterValues.colourType === 'white' || !filterValues.colourType) {
        // Apply white color filters when white tab is active or no tab is specified
        const colourSliderEl = document.getElementById('ds-colour-slider-noui');
        if (colourSliderEl && colourSliderEl.noUiSlider) {
          const colourValues = window.DiamondFilters.getSliderValues().colour;
          if (colourValues && colourValues.length > 0) {
            const minColour = colourValues[0];
            let maxColour = colourValues[colourValues.length - 1];

            if (minColour === maxColour) {
              const state = window.DiamondSearchState;
              const uniqueColours = [...new Set(state.FILTER_LABELS.colour)];
              const currentIndex = uniqueColours.indexOf(minColour);
              if (currentIndex < uniqueColours.length - 1) {
                maxColour = uniqueColours[currentIndex + 1];
              } else {
                maxColour = null;
              }
            }

            if (minColour) {
              params.append('minColour', minColour);
            }
            if (maxColour) {
              params.append('maxColour', maxColour);
            }
          }
        }
      } else if (
        filterValues.colourType === 'fancy' &&
        filterValues.fancyColours &&
        filterValues.fancyColours.length > 0
      ) {
        console.log('[DIAMOND API DEBUG] Applying fancy color filters');
        console.log(
          '[DIAMOND API DEBUG] fancyColours to be sent:',
          filterValues.fancyColours
        );

        // Only apply fancy filters if fancy colors are actually selected
        params.append('fancyColours', filterValues.fancyColours.join(','));

        // Add fancy intensity range
        if (
          filterValues.fancyIntensity &&
          filterValues.fancyIntensity.length > 0
        ) {
          const minIntensity = filterValues.fancyIntensity[0];
          const maxIntensity =
            filterValues.fancyIntensity[filterValues.fancyIntensity.length - 1];

          if (minIntensity) {
            params.append('minFancyIntensity', minIntensity);
          }
          if (maxIntensity && maxIntensity !== minIntensity) {
            params.append('maxFancyIntensity', maxIntensity);
          }
        }
      } else {
        console.log('[DIAMOND API DEBUG] No fancy color filters applied');
        console.log(
          '[DIAMOND API DEBUG] Reason - colourType:',
          filterValues.colourType,
          'fancyColours length:',
          filterValues.fancyColours
            ? filterValues.fancyColours.length
            : 'undefined'
        );
      }

      // Add clarity filters from sliders
      const claritySliderEl = document.getElementById('ds-clarity-slider-noui');
      if (claritySliderEl && claritySliderEl.noUiSlider) {
        const clarityValues = window.DiamondFilters.getSliderValues().clarity;
        if (clarityValues && clarityValues.length > 0) {
          const minClarity = clarityValues[0];
          let maxClarity = clarityValues[clarityValues.length - 1];

          if (minClarity === maxClarity) {
            const state = window.DiamondSearchState;
            const uniqueClarities = [...new Set(state.FILTER_LABELS.clarity)];
            const currentIndex = uniqueClarities.indexOf(minClarity);
            if (currentIndex < uniqueClarities.length - 1) {
              maxClarity = uniqueClarities[currentIndex + 1];
            } else {
              maxClarity = null;
            }
          }

          if (minClarity) params.append('minClarity', minClarity);
          if (maxClarity) {
            params.append('maxClarity', maxClarity);
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
          if (minCutGrade) params.append('minCutGrade', minCutGrade);
          if (maxCutGrade) params.append('maxCutGrade', maxCutGrade);
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
      if (fluorescenceSliderEl && fluorescenceSliderEl.noUiSlider) {
        const fluorescenceValues =
          window.DiamondFilters.getSliderValues().fluorescence;
        if (fluorescenceValues && fluorescenceValues.length > 0) {
          const minFluorescence = fluorescenceValues[0];
          const maxFluorescence =
            fluorescenceValues[fluorescenceValues.length - 1];
          if (minFluorescence)
            params.append('minFluorescence', minFluorescence);
          if (maxFluorescence)
            params.append('maxFluorescence', maxFluorescence);
        }
      }

      // Add polish filters from sliders
      const polishSliderEl = document.getElementById('ds-polish-slider-noui');
      if (polishSliderEl && polishSliderEl.noUiSlider) {
        const polishValues = window.DiamondFilters.getSliderValues().polish;
        if (polishValues && polishValues.length > 0) {
          const minPolish = polishValues[0];
          const maxPolish = polishValues[polishValues.length - 1];
          if (minPolish) params.append('minPolish', minPolish);
          if (maxPolish) params.append('maxPolish', maxPolish);
        }
      }

      // Add symmetry filters from sliders
      const symmetrySliderEl = document.getElementById(
        'ds-symmetry-slider-noui'
      );
      if (symmetrySliderEl && symmetrySliderEl.noUiSlider) {
        const symmetryValues = window.DiamondFilters.getSliderValues().symmetry;
        if (symmetryValues && symmetryValues.length > 0) {
          const minSymmetry = symmetryValues[0];
          const maxSymmetry = symmetryValues[symmetryValues.length - 1];
          if (minSymmetry) params.append('minSymmetry', minSymmetry);
          if (maxSymmetry) params.append('maxSymmetry', maxSymmetry);
        }
      }

      // Add table filters from sliders
      const tableSliderEl = document.getElementById('ds-table-slider');
      if (tableSliderEl && tableSliderEl.noUiSlider) {
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
      if (ratioSliderEl && ratioSliderEl.noUiSlider) {
        const ratioValues = ratioSliderEl.noUiSlider.get();
        if (ratioValues && ratioValues.length === 2) {
          const minRatio = parseFloat(ratioValues[0]);
          const maxRatio = parseFloat(ratioValues[1]);
          if (!isNaN(minRatio)) params.append('minRatio', minRatio.toString());
          if (!isNaN(maxRatio)) params.append('maxRatio', maxRatio.toString());
        }
      }

      return params.toString();
    },

    // Fetch diamond data from API
    async fetchDiamondData(page = 1, limit = 24, isLoadMore = false) {
      const state = window.DiamondSearchState;
      const gridArea = document.getElementById('diamond-grid-area');

      if (!isLoadMore) {
        if (gridArea) {
          gridArea.classList.add('tw-opacity-60');
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
          gridArea.classList.remove('tw-opacity-60');
          gridArea.innerHTML =
            '<p class="tw-text-center tw-py-10">Failed to load diamonds. Please try again later.</p>';
        }
      } finally {
        if (isLoadMore) {
          state.isLoadingMore = false;
          window.DiamondUI?.showLoadMoreIndicator(false);
        } else {
          if (gridArea) {
            gridArea.classList.remove('tw-opacity-60');
          }
        }
      }
    },
  };
}
