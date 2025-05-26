if (typeof window !== 'undefined') {
  window.allDiamonds = []; // Initialize empty, will be populated from API
  const activeFilters = {};
  window.diamondPaginationInfo = {}; // To store pagination details
  let isLoadingMore = false;
  let initialLoadComplete = false; // To track if initial filters have been set up

  // Slider state management
  let sliderInitializationState = {
    price: false,
    carat: false,
    colour: false,
    clarity: false,
    cutGrade: false // Changed from cut to cutGrade
  };

  // Default filter ranges - centralized configuration
  const DEFAULT_FILTER_RANGES = {
    price: [200, 5000000],
    carat: [0.50, 20.00],     // Start from 0.1 to include smaller diamonds
    colour: ['K', 'D'],      // Default: K to D
    clarity: ['I3', 'FL'],   // Default: I3 to FL (covers all clarity grades)
    cutGrade: ['Good', 'Astor'] // Changed from cut to cutGrade, reflects quality
  };

  // Label definitions - centralized for consistency
  const FILTER_LABELS = {
    colour: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'],
    clarity: ['I3', 'I2', 'I1', 'SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'],
    cutGrade: ['Good', 'Very Good', 'Excellent', 'Astor'] // Changed from cut to cutGrade
  };

  // Helper function to format numbers with commas for tooltips
  function formatNumber(value) {
    return Number(value).toLocaleString('en-US');
  }

  // Check if all sliders are initialized
  function areAllSlidersInitialized() {
    return Object.values(sliderInitializationState).every(state => state === true);
  }

  // Mark slider as initialized and check if we can proceed with initial filtering
  function markSliderInitialized(sliderType) {
    sliderInitializationState[sliderType] = true;

    // If all sliders are now initialized, apply initial filters (which will fetch data)
    if (areAllSlidersInitialized() && !initialLoadComplete) {
      applyInitialFilters();
    }
  }

  // Apply initial filters with proper default values
  function applyInitialFilters() {
    if (initialLoadComplete) return; // Prevent multiple calls

    // Set "ROUND" shape filter as active by default
    const roundShapeButton = document.getElementById('ds-shape-round');
    if (roundShapeButton) {
      roundShapeButton.dataset.active = 'true';
      roundShapeButton.setAttribute('aria-pressed', 'true');
      console.log('[SHAPE] Set ROUND button as active by default');
    } else {
      console.warn('[SHAPE] ROUND shape button not found! Available buttons:');
      const shapeButtons = document.querySelectorAll('[data-filter-group="ds-shape"] button');
      shapeButtons.forEach(btn => {
        console.log('[SHAPE] Button ID:', btn.id, 'Value:', btn.dataset.value);
      });
    }

    setupFilterButtonGroups(); // Initialize filter states from buttons

    // Now that filters are set up, fetch fresh data with the correct filters
    console.log('[INITIAL] Active filters after setup:', activeFilters);
    console.log('[INITIAL] Fetching diamonds with default ROUND filter');
    fetchDiamondData(1, window.diamondPaginationInfo.limit || 24);

    initialLoadComplete = true;
  }

  function initializeSliders() {
    const priceSlider = document.getElementById('ds-price-slider');
    const caratSlider = document.getElementById('ds-carat-slider');
    const colourSlider = document.getElementById('ds-colour-slider-noui');
    const claritySlider = document.getElementById('ds-clarity-slider-noui');
    const cutGradeSlider = document.getElementById('ds-cut-grade-slider-noui'); // Changed from cutSlider and ID

    const minPriceInput = document.getElementById('ds-min-price');
    const maxPriceInput = document.getElementById('ds-max-price');
    const minCaratInput = document.getElementById('ds-min-carat');
    const maxCaratInput = document.getElementById('ds-max-carat');

    let sliderChangeTimeout;
    const debounceFetch = () => {
      clearTimeout(sliderChangeTimeout);
      sliderChangeTimeout = setTimeout(() => {
        fetchDiamondData(1, window.diamondPaginationInfo.limit || 24);
      }, 500); // 500ms debounce
    };

    // Initialize Price Slider
    if (priceSlider && minPriceInput && maxPriceInput) {
      window.noUiSlider.create(priceSlider, {
        start: DEFAULT_FILTER_RANGES.price,
        connect: true,
        step: 100,
        range: {
          'min': [DEFAULT_FILTER_RANGES.price[0]],
          'max': [DEFAULT_FILTER_RANGES.price[1]]
        },
        format: {
          to: function (value) {
            return formatNumber(Math.round(value));
          },
          from: function (value) {
            return Number(value.replace(/,/g, ''));
          }
        }
      });

      priceSlider.noUiSlider.on('update', function (values, handle) {
        const value = values[handle].replace(/,/g, '');
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

      markSliderInitialized('price');
    }

    // Initialize Carat Slider
    if (caratSlider && minCaratInput && maxCaratInput) {
      window.noUiSlider.create(caratSlider, {
        start: DEFAULT_FILTER_RANGES.carat,
        connect: true,
        step: 0.01,
        range: {
          'min': [0.1],
          'max': [30.00]
        },
        format: {
            to: function(value) {
                return value.toFixed(2);
            },
            from: function(value) {
                return Number(value);
            }
        }
      });

      caratSlider.noUiSlider.on('update', function (values, handle) {
        if (handle === 0) {
          minCaratInput.value = values[handle];
        } else {
          maxCaratInput.value = values[handle];
        }
      });

      caratSlider.noUiSlider.on('change', debounceFetch);

      minCaratInput.addEventListener('change', function () {
        caratSlider.noUiSlider.set([this.value, null]);
      });
      maxCaratInput.addEventListener('change', function () {
        caratSlider.noUiSlider.set([null, this.value]);
      });

      markSliderInitialized('carat');
    }

    // Initialize Colour Slider
    if (colourSlider) {
      const colorLabels = FILTER_LABELS.colour;
      const defaultColorStart = [0, 7]; // K to D

      window.noUiSlider.create(colourSlider, {
        start: defaultColorStart,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 7
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

      // colourSlider.noUiSlider.on('change', debounceFetch); // DISABLED: Colour filter no longer affects results

      // Verify slider initialization
      setTimeout(() => {
        markSliderInitialized('colour');
      }, 10); // Small delay to ensure slider is fully ready
    }

        // Initialize Clarity Slider
    if (claritySlider) {
      const clarityLabels = FILTER_LABELS.clarity;
      const defaultClarityStart = [0, 10]; // I3 to FL (covers full range)

      window.noUiSlider.create(claritySlider, {
        start: defaultClarityStart,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': 10
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

      // claritySlider.noUiSlider.on('change', debounceFetch); // DISABLED: Clarity filter no longer affects results

      // Verify slider initialization
      setTimeout(() => {
        markSliderInitialized('clarity');
      }, 10); // Small delay to ensure slider is fully ready
    }

    // Initialize Cut Grade Slider (formerly Cut Slider)
    if (cutGradeSlider) {
      console.log('[DEBUG] Initializing cutGradeSlider. Current slider instance:', cutGradeSlider.noUiSlider);
      const cutGradeLabels = FILTER_LABELS.cutGrade; // Use cutGrade labels
      // Ensure defaultCutGradeStart aligns with FILTER_LABELS.cutGrade and DEFAULT_FILTER_RANGES.cutGrade
      const defaultCutGradeStart = [
        cutGradeLabels.indexOf(DEFAULT_FILTER_RANGES.cutGrade[0]),
        cutGradeLabels.indexOf(DEFAULT_FILTER_RANGES.cutGrade[1])
      ];
      console.log('[DEBUG] cutGradeSlider defaultCutGradeStart:', defaultCutGradeStart, 'Based on:', DEFAULT_FILTER_RANGES.cutGrade);

      // Check if a slider instance already exists and destroy it to prevent errors/duplicates
      if (cutGradeSlider.noUiSlider) {
        console.log('[DEBUG] Destroying existing cutGradeSlider instance before re-creating.');
        cutGradeSlider.noUiSlider.destroy();
      }

      window.noUiSlider.create(cutGradeSlider, {
        start: defaultCutGradeStart,
        connect: true,
        step: 1,
        range: {
          'min': 0,
          'max': cutGradeLabels.length - 1 // Max index of cutGradeLabels
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

      // cutGradeSlider.noUiSlider.on('change', debounceFetch); // DISABLED: Cut grade filter no longer affects results

      // Verify slider initialization
      setTimeout(() => {
        markSliderInitialized('cutGrade'); // Mark cutGrade as initialized
      }, 10); // Small delay to ensure slider is fully ready
    }
  }

  function showLoadMoreIndicator(show) {
    const indicator = document.getElementById('ds-load-more-indicator');
    if (indicator) {
      indicator.style.display = show ? 'block' : 'none';
    }
  }

  function renderDiamonds(diamondsToRender) {
    const gridArea = document.getElementById('diamond-grid-area');
    const resultsCountEl = document.getElementById('ds-results-count');

    if (!gridArea) return;

    // Always clear previous results from the grid area.
    gridArea.innerHTML = '';

    if (!diamondsToRender || diamondsToRender.length === 0) {
        gridArea.innerHTML = '<p class="tw-text-center tw-text-gray-500 tw-py-10">No diamonds match your criteria.</p>';
    } else {
        const grid = document.createElement('div');
        grid.className = 'tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6';
        gridArea.appendChild(grid);

        diamondsToRender.forEach(diamond => {
            const diamondCard = document.createElement('div');
            diamondCard.className = 'tw-flex tw-flex-col tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-shadow hover:tw-shadow-md tw-transition-shadow tw-overflow-hidden';

            const image = document.createElement('img');
            image.className = 'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';

            if (diamond.imagePath) {
              image.src = diamond.imagePath;
            } else {
              image.src = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
            }

            const carats = diamond.carat !== null && typeof diamond.carat === 'number' ? diamond.carat.toFixed(2) : 'N/A';
            const shape = diamond.cut || 'Unknown Shape';
            const displayType = 'Diamond';

            image.alt = `${carats}ct ${shape} ${displayType}`;

            const titleText = `${carats}ct ${shape} ${displayType}`;
            const title = document.createElement('h3');
            title.className = 'tw-text-lg tw-font-semibold tw-mb-1 tw-truncate';
            title.textContent = titleText;

            const subtitleParts = [];
            if (diamond.color) subtitleParts.push(`Colour: ${diamond.color}`);
            if (diamond.clarity) subtitleParts.push(`Clarity: ${diamond.clarity}`);
            if (diamond.cutGrade) subtitleParts.push(`Cut: ${diamond.cutGrade}`);

            if (subtitleParts.length === 0) {
              subtitleParts.push('Details not specified');
            }

            const subtitle = document.createElement('p');
            subtitle.className = 'tw-text-sm tw-text-gray-600 tw-mb-2';
            subtitle.textContent = subtitleParts.join(', ');

            const priceCertWrapper = document.createElement('div');
            priceCertWrapper.className = 'tw-flex tw-justify-between tw-items-center tw-mb-3';

            const price = document.createElement('p');
            price.className = 'tw-text-lg tw-font-bold text-gray-900';
            const displayPrice = diamond.totalPrice !== null && typeof diamond.totalPrice === 'number' ? diamond.totalPrice.toLocaleString() : 'Price N/A';
            const displayCurrency = 'USD';
            price.textContent = `${displayPrice} ${displayCurrency}`.trim();

            const certInfo = document.createElement('p');
            certInfo.className = 'tw-text-sm tw-text-gray-500';
            certInfo.textContent = diamond.gradingLab ? `${diamond.gradingLab} Certified` : 'Certification N/A';

            priceCertWrapper.appendChild(price);
            priceCertWrapper.appendChild(certInfo);

            diamondCard.appendChild(image);
            diamondCard.appendChild(title);
            diamondCard.appendChild(subtitle);
            diamondCard.appendChild(priceCertWrapper);

            const addButton = document.createElement('button');
            addButton.className = 'tw-w-full tw-bg-white tw-text-gray-800 tw-py-2 tw-px-4 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition-colors tw-text-base tw-mt-auto';
            addButton.textContent = 'Add to cart';
            addButton.onclick = () => {}; // Removed console.log

            diamondCard.appendChild(addButton);
            grid.appendChild(diamondCard); // Append to grid, not gridArea
        });
    }

    // Update results count based on totalDiamonds from paginationInfo (which now reflects filtered results)
    if (resultsCountEl && window.diamondPaginationInfo && window.diamondPaginationInfo.totalDiamonds !== undefined) {
      const currentlyShown = window.allDiamonds.length; // Total diamonds loaded so far (across all pages)
      const totalFiltered = window.diamondPaginationInfo.totalDiamonds; // Total matching the current filters
      resultsCountEl.textContent = `Showing ${currentlyShown} of ${totalFiltered} diamonds`;
    } else if (resultsCountEl) {
      resultsCountEl.textContent = `${diamondsToRender.length} diamonds`; // Fallback if pagination info not ready or for initial state
    }
  }

  function buildFilterQueryString() {
    const params = new URLSearchParams();

    // Add shape filter - default to ROUND if no shape is selected yet
    if (activeFilters['ds-shape']) {
      params.append('shape', activeFilters['ds-shape']);
    } else if (!initialLoadComplete) {
      // For initial load, default to ROUND shape
      params.append('shape', 'ROUND');
    }

    // Add type filter
    if (activeFilters['ds-type']) {
      params.append('type', activeFilters['ds-type']);
    }

    // Add price filters from sliders
    const priceSliderEl = document.getElementById('ds-price-slider');
    if (priceSliderEl && priceSliderEl.noUiSlider) {
      const priceValues = priceSliderEl.noUiSlider.get();
      if (priceValues && priceValues.length === 2) {
        const minPrice = parseFloat(String(priceValues[0]).replace(/,/g, ''));
        const maxPrice = parseFloat(String(priceValues[1]).replace(/,/g, ''));
        if (!isNaN(minPrice)) params.append('minPrice', minPrice.toString());
        if (!isNaN(maxPrice)) params.append('maxPrice', maxPrice.toString());
      }
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

    return params.toString();
  }

  async function fetchDiamondData(page = 1, limit = 24, isLoadMore = false) {
    const gridArea = document.getElementById('diamond-grid-area');

    if (!isLoadMore) {
      if (gridArea) {
        gridArea.innerHTML = '<p class="tw-text-center tw-py-10 tw-text-gray-500">Loading available diamonds...</p>';
      }
    } else {
      isLoadingMore = true;
      showLoadMoreIndicator(true);
    }

    try {
      const filterParams = buildFilterQueryString();
      const baseUrl = `/apps/api/diamonds/all?page=${page}&limit=${limit}`;
      const url = filterParams ? `${baseUrl}&${filterParams}` : baseUrl;

      console.log('[FETCH] Requesting diamonds with URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();

      const newDiamonds = data.diamonds || [];

      if (isLoadMore) {
        window.allDiamonds = [...window.allDiamonds, ...newDiamonds];
        window.diamondPaginationInfo = {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalDiamonds: data.totalDiamonds,
          limit: data.limit,
          totalNaturalDiamonds: data.totalNaturalDiamonds,
          totalLabDiamonds: data.totalLabDiamonds,
        };
        applyAllFilters(); // Re-render with the expanded list (already filtered by server)
      } else { // Initial Load OR Full Filter Refresh Action
        window.allDiamonds = newDiamonds; // Replace current diamonds
        if (gridArea) gridArea.innerHTML = ''; // Clear loading/previous message

        // Filter out any diamonds where the 'cut' property is literally 'Cut' (case-insensitive)
        // This is to prevent a potential header row or bad data from interfering.
        window.allDiamonds = window.allDiamonds.filter(d => d.cut && d.cut.toLowerCase() !== 'cut');

        window.diamondPaginationInfo = {
          currentPage: data.currentPage,
          totalPages: data.totalPages,
          totalDiamonds: data.totalDiamonds,
          limit: data.limit,
          totalNaturalDiamonds: data.totalNaturalDiamonds,
          totalLabDiamonds: data.totalLabDiamonds,
        };

                console.log('[DIAMONDS] Fetched:', window.allDiamonds.length, 'diamonds');
        if (window.allDiamonds.length > 0) {
          // Show all unique shapes in the dataset
          const uniqueShapes = [...new Set(window.allDiamonds.map(d => d.cut).filter(Boolean))];
          console.log('[SHAPES] Available in dataset:', uniqueShapes);
        }

        // Render the fetched diamonds
        applyAllFilters(); // Regular call, uses current slider values
      }
    } catch (error) {
      console.error('Failed to fetch diamond data:', error);
      if (gridArea && !isLoadMore) { // Only show main error if not loading more
        gridArea.innerHTML = '<p class="tw-text-center tw-text-red-500 tw-py-10">Failed to load diamonds. Please try again later.</p>';
      }
    } finally {
      if (isLoadMore) {
        isLoadingMore = false;
        showLoadMoreIndicator(false);
      }
    }
  }

  function getSliderValues(useInitialDefaults = false) {
    const values = {};

    if (useInitialDefaults) {
      // Return the centralized default values
      return {
        price: DEFAULT_FILTER_RANGES.price.map(String), // Convert to strings for consistency
        carat: DEFAULT_FILTER_RANGES.carat.map(val => val.toFixed(2)),
        colour: DEFAULT_FILTER_RANGES.colour,
        clarity: DEFAULT_FILTER_RANGES.clarity,
        cutGrade: DEFAULT_FILTER_RANGES.cutGrade
      };
    }

    // Get current values from sliders
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

    return values;
  }

  function applyAllFilters(useInitialDefaults = false) {
    // Since filtering now happens server-side, this function mainly handles
    // rendering the diamonds that were already filtered by the server
    // This is kept for initial load and any local-only operations

    console.log('[FILTERS] Rendering diamonds (server-side filtering active). Count:', window.allDiamonds.length);
    renderDiamonds(window.allDiamonds);
  }

  function setupFilterButtonGroups() {
    const filterGroups = document.querySelectorAll('[data-filter-group]');
    filterGroups.forEach(group => {
      const groupId = group.dataset.filterGroup;
      const isMultiSelect = group.dataset.multiselect === 'true';
      const buttons = group.querySelectorAll('button'); // Changed selector

      if (!isMultiSelect) {
        activeFilters[groupId] = null;
        buttons.forEach(btn => {
            if (btn.dataset.active === 'true') {
                activeFilters[groupId] = btn.dataset.value;
            }
        });
      } else {
        activeFilters[groupId] = [];
        buttons.forEach(btn => {
            if (btn.dataset.active === 'true') {
                activeFilters[groupId].push(btn.dataset.value);
            }
        });
      }

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value;
          if (isMultiSelect) {
            const index = activeFilters[groupId].indexOf(value);
            if (index > -1) {
              activeFilters[groupId].splice(index, 1);
              button.dataset.active = 'false';
              button.setAttribute('aria-pressed', 'false');
            } else {
              activeFilters[groupId].push(value);
              button.dataset.active = 'true';
              button.setAttribute('aria-pressed', 'true');
            }
          } else {
            if (activeFilters[groupId] && activeFilters[groupId] !== value) {
                const previousActiveButton = group.querySelector(`button[data-value="${activeFilters[groupId]}"]`);
                if (previousActiveButton) {
                    previousActiveButton.dataset.active = 'false';
                    previousActiveButton.setAttribute('aria-pressed', 'false');
                }
            }

            if (activeFilters[groupId] === value) {
              // Clicking the already active button toggles it off for single-select (optional behavior)
              // If you want it to stay selected, remove this block
              // activeFilters[groupId] = null;
              // button.dataset.active = 'false';
              // button.setAttribute('aria-pressed', 'false');
            } else {
              activeFilters[groupId] = value;
              button.dataset.active = 'true';
              button.setAttribute('aria-pressed', 'true');
            }
          }
          // Trigger fresh fetch for active filter groups (shape, type, price, carat)
          if (groupId === 'ds-shape' || groupId === 'ds-type') {
            console.log(`[DEBUG] ${groupId} filter changed, fetching fresh diamonds from server`);
            fetchDiamondData(1, window.diamondPaginationInfo.limit || 24); // Re-fetch with new filters
          } else {
            // For other filters that might trigger re-fetching (if any are still active)
            fetchDiamondData(1, window.diamondPaginationInfo.limit || 24); // Re-fetch to apply filters
          }
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    // Initialize sliders - they will trigger the initial fetch with proper filters when ready
    initializeSliders(); // Initialize sliders immediately

    const applyFiltersButton = document.getElementById('ds-apply-filters');
    if (applyFiltersButton) {
      // applyFiltersButton.addEventListener('click', applyAllFilters);
      // Modified: When 'Apply Filters' is clicked, re-fetch from page 1
      applyFiltersButton.addEventListener('click', () => {
        fetchDiamondData(1, window.diamondPaginationInfo.limit || 24);
      });
    }

    const inputBasedFilterElements = ['ds-min-carat', 'ds-max-carat', 'ds-min-price', 'ds-max-price'];
    inputBasedFilterElements.forEach(id => {
        const el = document.getElementById(id);
        if(el) {
            el.addEventListener('input', () => { // Fires as user types
                clearTimeout(el.filterTimeout);
                el.filterTimeout = setTimeout(() => {
                    const sliderId = el.id.includes('price') ? 'ds-price-slider' : 'ds-carat-slider';
                    const sliderElement = document.getElementById(sliderId);

                    if (sliderElement && sliderElement.noUiSlider) {
                        // Get current numerical values from the slider to preserve the other handle's value
                        const sliderValues = sliderElement.noUiSlider.get();
                        let val1_str = String(sliderValues[0]);
                        let val2_str = String(sliderValues[1]);

                        let numVal1, numVal2;
                        if (el.id.includes('price')) {
                            numVal1 = parseFloat(val1_str.replace(/,/g, ''));
                            numVal2 = parseFloat(val2_str.replace(/,/g, ''));
                        } else { // carat
                            numVal1 = parseFloat(val1_str);
                            numVal2 = parseFloat(val2_str);
                        }

                        let inputValue = parseFloat(el.value.replace(/,/g, ''));

                        if (isNaN(inputValue)) {
                           // If input is not a valid number, don't attempt to set slider
                           // or it might jump to min/max based on noUiSlider's internal parsing of bad values.
                           // Alternatively, you could revert input or show validation.
                           return;
                        }

                        if (el.id.includes('min')) {
                            sliderElement.noUiSlider.set([inputValue, null]);
                        } else { // max
                            sliderElement.noUiSlider.set([null, inputValue]);
                        }
                        // The slider's own 'change' event (with debounceFetch) will handle fetching.
                    }
                }, 750); // Debounce for typed input to update slider
            });
        }
    });

    const colorSlider = document.getElementById('ds-colour-slider');
    const colorImagesDiv = document.getElementById('ds-colour-images');

    if (colorSlider && colorImagesDiv) {
      const showImages = () => {
        colorImagesDiv.style.opacity = '1';
        colorImagesDiv.style.pointerEvents = 'auto';
      };
      const hideImages = () => {
        colorImagesDiv.style.opacity = '0';
        colorImagesDiv.style.pointerEvents = 'none';
      };
      colorSlider.addEventListener('mousedown', showImages);
      colorSlider.addEventListener('touchstart', showImages);
      document.addEventListener('mouseup', hideImages);
      colorSlider.addEventListener('blur', hideImages);
      document.addEventListener('touchend', hideImages);
    }

    // Infinite scroll listener
    window.addEventListener('scroll', () => {
      if (isLoadingMore || !window.diamondPaginationInfo || window.diamondPaginationInfo.currentPage >= window.diamondPaginationInfo.totalPages) {
        return; // Don't load if already loading or if on the last page
      }

      // Check if scrolled to near the bottom
      if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 600) { // Changed 300px to 600px threshold
        fetchDiamondData(window.diamondPaginationInfo.currentPage + 1, window.diamondPaginationInfo.limit, true);
      }
    });
  });
}