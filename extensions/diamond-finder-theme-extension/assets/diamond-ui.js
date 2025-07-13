// Diamond UI Module
if (typeof window !== 'undefined') {
  window.DiamondUI = {
    // Show/hide loading indicator for "load more"
    showLoadMoreIndicator(show) {
      const gridArea = document.getElementById('diamond-grid-area');
      if (gridArea) {
        if (show) {
          gridArea.classList.add('tw-opacity-60');
        } else {
          gridArea.classList.remove('tw-opacity-60');
        }
      }
    },

    // Initialize all UI components and event handlers
    initialize() {
      this.setupSortDropdown();
      this.setupAdvancedFiltersToggle();
      this.setupInfiniteScroll();
      this.setupInputFilters();
      this.setupColourSliderImages();
      this.setupClaritySliderImages();
      // Note: applyInitialFilters() is now called only after all sliders are initialized
      // This is handled by DiamondSearchApp.triggerInitialLoad()
    },

    // Apply initial filters and fetch data
    applyInitialFilters() {
      const state = window.DiamondSearchState;

      console.log('[DIAMOND UI] applyInitialFilters called', {
        initialLoadComplete: state.initialLoadComplete,
        allSlidersInitialized: state.areAllSlidersInitialized(),
      });

      if (state.initialLoadComplete) {
        console.log('[DIAMOND UI] Initial load already complete, skipping');
        return;
      }

      // Set default type filter
      state.setFilter('ds-type', 'Natural');
      const naturalTypeButton = document.getElementById('ds-type-natural');
      if (naturalTypeButton) {
        naturalTypeButton.dataset.active = 'true';
        naturalTypeButton.setAttribute('aria-pressed', 'true');
      }
      const labTypeButton = document.getElementById('ds-type-lab-grown');
      if (labTypeButton) {
        labTypeButton.dataset.active = 'false';
        labTypeButton.setAttribute('aria-pressed', 'false');
      }

      // Set default shape filter
      const roundShapeButton = document.getElementById('ds-shape-round');
      if (roundShapeButton) {
        roundShapeButton.dataset.active = 'true';
        roundShapeButton.setAttribute('aria-pressed', 'true');
      }

      // Set default certificate filter
      state.setFilter('ds-certificate', ['GIA', 'IGI', 'HRD']);
      state.setFilter('ds-certificate-initial-state', true);

      const certificateButtons = document.querySelectorAll(
        '[data-filter-group="ds-certificate"] button'
      );
      certificateButtons.forEach((button) => {
        button.dataset.active = 'false';
        button.setAttribute('aria-pressed', 'false');
      });

      // Ensure white color tab is active initially (to exclude fancy colored diamonds)
      const whiteTab = document.getElementById('ds-colour-tab-white');
      const fancyTab = document.getElementById('ds-colour-tab-fancy');
      const whitePanel = document.getElementById('ds-colour-panel-white');
      const fancyPanel = document.getElementById('ds-colour-panel-fancy');

      if (whiteTab && fancyTab && whitePanel && fancyPanel) {
        // Set white tab as active
        whiteTab.dataset.active = 'true';
        whiteTab.setAttribute('aria-pressed', 'true');

        // Set fancy tab as inactive
        fancyTab.dataset.active = 'false';
        fancyTab.setAttribute('aria-pressed', 'false');

        // Show white panel, hide fancy panel
        whitePanel.classList.remove('tw-hidden');
        fancyPanel.classList.add('tw-hidden');
      }

      // Setup filter button groups
      window.DiamondFilters.setupFilterButtonGroups();

      // Log initial filters - only show what's actually being applied
      const initialSliderValues = window.DiamondFilters.getSliderValues(true);
      const appliedFilters = {
        price: initialSliderValues.price,
        carat: initialSliderValues.carat,
        colour: initialSliderValues.colour,
        clarity: initialSliderValues.clarity,
        cutGrade: initialSliderValues.cutGrade,
        // Advanced filters are NOT included as they're not applied initially
      };

      console.log('[INITIAL USER SELECTIONS]', {
        ...state.activeFilters,
        sliders: appliedFilters,
      });

      // Show the filter UI and search header now that sliders are ready
      const filterUI = document.querySelector('.diamond-filters-ui');
      const searchHeader = document.getElementById('diamond-search-header');

      if (filterUI) {
        filterUI.classList.remove('tw-hidden');
        console.log('[DIAMOND UI] Filter UI shown');
      }
      if (searchHeader) {
        searchHeader.classList.remove('tw-hidden');
        console.log('[DIAMOND UI] Search header shown');
      }

      // Fetch initial data
      // Basic filters (shape, type, price, carat, color, clarity, cut grade) will be applied
      // Advanced filters (fluorescence, polish, symmetry, table, ratio) will NOT be applied unless the user changes them
      // Certificates will include all by default (GIA, IGI, HRD)
      console.log('[DIAMOND UI] Making initial API call with sliders ready');
      window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
      state.initialLoadComplete = true;
      console.log('[DIAMOND UI] Initial load complete flag set to true');
    },

    // Setup sort dropdown
    setupSortDropdown() {
      const state = window.DiamondSearchState;
      const sortDropdown = document.getElementById('ds-sort-by');

      if (!sortDropdown) return;

      const sortMapping = {
        'Price: low to high': 'price-low-high',
        'Price: high to low': 'price-high-low',
        'Carat: low to high': 'carat-low-high',
        'Carat: high to low': 'carat-high-low',
      };

      sortDropdown.value = 'Price: low to high';
      state.updateSort('price-low-high');

      sortDropdown.addEventListener('change', function () {
        const selectedValue = this.value;
        const mappedSort = sortMapping[selectedValue];

        if (mappedSort) {
          state.updateSort(mappedSort);
          console.log(`[SORT CHANGED] New sort: ${state.currentSort}`);
          window.DiamondRenderer.renderDiamonds(state.allDiamonds);
        }
      });
    },

    // Setup advanced filters toggle
    setupAdvancedFiltersToggle() {
      const advancedFiltersToggle = document.getElementById(
        'ds-advanced-filters-toggle'
      );
      const advancedFiltersContent = document.getElementById(
        'ds-advanced-filters-content'
      );

      if (!advancedFiltersToggle || !advancedFiltersContent) return;

      advancedFiltersToggle.addEventListener('click', () => {
        advancedFiltersContent.classList.toggle('tw-hidden');

        // Rotate chevron icon
        const svg = advancedFiltersToggle.querySelector('svg');
        if (svg) {
          svg.style.transform = advancedFiltersContent.classList.contains(
            'tw-hidden'
          )
            ? 'rotate(0deg)'
            : 'rotate(180deg)';
          svg.style.transition = 'transform 0.3s ease';
        }

        // Setup filter button groups when showing advanced filters
        if (!advancedFiltersContent.classList.contains('tw-hidden')) {
          setTimeout(() => {
            window.DiamondFilters.setupFilterButtonGroups();
            window.DiamondFilters.updateCertificateFilterVisualState();
          }, 10);
        }
      });
    },

    // Setup infinite scroll
    setupInfiniteScroll() {
      const state = window.DiamondSearchState;
      let scrollTimeout;
      let lastTriggerTime = 0;
      const MIN_TIME_BETWEEN_REQUESTS = 3000;

      const handleScroll = () => {
        const now = Date.now();

        if (
          state.isLoadingMore ||
          !state.paginationInfo?.currentPage ||
          !state.paginationInfo?.totalPages ||
          state.paginationInfo.currentPage >= state.paginationInfo.totalPages ||
          now - lastTriggerTime < MIN_TIME_BETWEEN_REQUESTS
        ) {
          return;
        }

        const diamondGrid = document.getElementById('diamond-grid-area');
        if (!diamondGrid) return;

        const gridRect = diamondGrid.getBoundingClientRect();
        const triggerThreshold = window.innerHeight + 300;

        if (gridRect.bottom <= triggerThreshold) {
          lastTriggerTime = now;
          window.DiamondAPI.fetchDiamondData(
            state.paginationInfo.currentPage + 1,
            state.paginationInfo.limit,
            true
          );
        }
      };

      const debouncedScrollHandler = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(handleScroll, 300);
      };

      window.addEventListener('scroll', debouncedScrollHandler, {
        passive: true,
      });
    },

    // Setup input-based filters
    setupInputFilters() {
      const inputBasedFilterElements = [
        'ds-min-carat',
        'ds-max-carat',
        'ds-min-price',
        'ds-max-price',
        'ds-min-table',
        'ds-max-table',
        'ds-min-ratio',
        'ds-max-ratio',
      ];

      inputBasedFilterElements.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('input', () => {
          clearTimeout(el.filterTimeout);
          el.filterTimeout = setTimeout(() => {
            let sliderId;
            if (el.id.includes('price')) {
              sliderId = 'ds-price-slider';
            } else if (el.id.includes('carat')) {
              sliderId = 'ds-carat-slider';
            } else if (el.id.includes('table')) {
              sliderId = 'ds-table-slider';
            } else if (el.id.includes('ratio')) {
              sliderId = 'ds-ratio-slider';
            }

            const sliderElement = document.getElementById(sliderId);

            if (sliderElement && sliderElement.noUiSlider) {
              // Clean the input value first - remove spaces and parse as number
              let inputValue;
              if (el.id.includes('price')) {
                // For price inputs, remove all spaces and parse as number
                inputValue = parseFloat(el.value.replace(/\s/g, ''));
              } else if (el.id.includes('table')) {
                inputValue = parseFloat(el.value.replace('%', ''));
              } else if (el.id.includes('ratio')) {
                inputValue = parseFloat(el.value);
              } else {
                inputValue = parseFloat(el.value.replace(/\s/g, ''));
              }

              if (isNaN(inputValue)) return;

              // Set the slider value with the clean numeric value
              if (el.id.includes('min')) {
                sliderElement.noUiSlider.set([inputValue, null]);
              } else {
                sliderElement.noUiSlider.set([null, inputValue]);
              }

              // Trigger filter update after setting slider value
              if (
                window.DiamondFiltersUtils &&
                window.DiamondFiltersUtils.createDebouncedFetch
              ) {
                const debounceFetch =
                  window.DiamondFiltersUtils.createDebouncedFetch();
                debounceFetch();
              }
            }
          }, 500);
        });
      });
    },

    // Setup colour slider images
    setupColourSliderImages() {
      const colorSlider = document.getElementById('ds-colour-slider-noui');
      const colorImagesDiv = document.getElementById('ds-colour-images');

      if (!colorSlider || !colorImagesDiv) return;

      let isSliderDragging = false;

      const showImages = () => {
        colorImagesDiv.style.opacity = '1';
        colorImagesDiv.style.pointerEvents = 'auto';
      };

      const hideImages = () => {
        if (!isSliderDragging) {
          colorImagesDiv.style.opacity = '0';
          colorImagesDiv.style.pointerEvents = 'none';
        }
      };

      // Setup slider event handlers
      const setupSliderEvents = () => {
        if (colorSlider.noUiSlider) {
          colorSlider.noUiSlider.on('start', function () {
            isSliderDragging = true;
            showImages();
          });

          colorSlider.noUiSlider.on('end', function () {
            isSliderDragging = false;
            hideImages();
          });
        }
      };

      // Try immediately or wait for slider initialization
      if (colorSlider.noUiSlider) {
        setupSliderEvents();
      } else {
        setTimeout(setupSliderEvents, 100);
      }

      // Keep images visible when hovering
      colorImagesDiv.addEventListener('mouseenter', showImages);
      colorImagesDiv.addEventListener('mouseleave', () => {
        if (!isSliderDragging) {
          hideImages();
        }
      });
    },

    setupClaritySliderImages() {
      const claritySlider = document.getElementById('ds-clarity-slider-noui');
      const clarityImagesDiv = document.getElementById('ds-clarity-images');
      if (!claritySlider || !clarityImagesDiv) return;
      let isSliderDragging = false;
      const showImages = () => {
        clarityImagesDiv.style.opacity = '1';
        clarityImagesDiv.style.pointerEvents = 'auto';
      };
      const hideImages = () => {
        if (!isSliderDragging) {
          clarityImagesDiv.style.opacity = '0';
          clarityImagesDiv.style.pointerEvents = 'none';
        }
      };
      // Setup slider event handlers
      const setupSliderEvents = () => {
        if (claritySlider.noUiSlider) {
          claritySlider.noUiSlider.on('start', function () {
            isSliderDragging = true;
            showImages();
          });
          claritySlider.noUiSlider.on('end', function () {
            isSliderDragging = false;
            hideImages();
          });
        }
      };
      // Try immediately or wait for slider initialization
      if (claritySlider.noUiSlider) {
        setupSliderEvents();
      } else {
        setTimeout(setupSliderEvents, 100);
      }
      // Keep images visible when hovering
      clarityImagesDiv.addEventListener('mouseenter', showImages);
      clarityImagesDiv.addEventListener('mouseleave', () => {
        if (!isSliderDragging) {
          hideImages();
        }
      });
    },
  };
}
