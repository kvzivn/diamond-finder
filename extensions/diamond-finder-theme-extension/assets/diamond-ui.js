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
      this.applyInitialFilters();
    },

    // Apply initial filters and fetch data
    applyInitialFilters() {
      const state = window.DiamondSearchState;

      if (state.initialLoadComplete) return;

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

      const certificateButtons = document.querySelectorAll('[data-filter-group="ds-certificate"] button');
      certificateButtons.forEach(button => {
        button.dataset.active = 'false';
        button.setAttribute('aria-pressed', 'false');
      });

      // Setup filter button groups
      window.DiamondFilters.setupFilterButtonGroups();

      // Log initial filters
      const initialSliderValues = window.DiamondFilters.getSliderValues(true);
      console.log("[INITIAL FILTERS]", { ...state.activeFilters, sliders: initialSliderValues });

      // Fetch initial data
      window.DiamondAPI.fetchDiamondData(1, state.paginationInfo.limit || 24);
      state.initialLoadComplete = true;
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
        'Carat: high to low': 'carat-high-low'
      };

      sortDropdown.value = 'Price: low to high';
      state.updateSort('price-low-high');

      sortDropdown.addEventListener('change', function() {
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
      const advancedFiltersToggle = document.getElementById('ds-advanced-filters-toggle');
      const advancedFiltersContent = document.getElementById('ds-advanced-filters-content');

      if (!advancedFiltersToggle || !advancedFiltersContent) return;

      advancedFiltersToggle.addEventListener('click', () => {
        advancedFiltersContent.classList.toggle('tw-hidden');

        // Rotate chevron icon
        const svg = advancedFiltersToggle.querySelector('svg');
        if (svg) {
          svg.style.transform = advancedFiltersContent.classList.contains('tw-hidden') ? 'rotate(0deg)' : 'rotate(180deg)';
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

      window.addEventListener('scroll', () => {
        if (state.isLoadingMore || !state.paginationInfo || state.paginationInfo.currentPage >= state.paginationInfo.totalPages) {
          return;
        }

        if (window.innerHeight + window.scrollY >= document.documentElement.offsetHeight - 600) {
          window.DiamondAPI.fetchDiamondData(state.paginationInfo.currentPage + 1, state.paginationInfo.limit, true);
        }
      });
    },

    // Setup input-based filters
    setupInputFilters() {
      const inputBasedFilterElements = ['ds-min-carat', 'ds-max-carat', 'ds-min-price', 'ds-max-price'];

      inputBasedFilterElements.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;

        el.addEventListener('input', () => {
          clearTimeout(el.filterTimeout);
          el.filterTimeout = setTimeout(() => {
            const sliderId = el.id.includes('price') ? 'ds-price-slider' : 'ds-carat-slider';
            const sliderElement = document.getElementById(sliderId);

            if (sliderElement && sliderElement.noUiSlider) {
              const sliderValues = sliderElement.noUiSlider.get();
              let val1_str = String(sliderValues[0]);
              let val2_str = String(sliderValues[1]);

              let numVal1, numVal2;
              if (el.id.includes('price')) {
                numVal1 = parseFloat(val1_str.replace(/\s/g, ''));
                numVal2 = parseFloat(val2_str.replace(/\s/g, ''));
              } else {
                numVal1 = parseFloat(val1_str);
                numVal2 = parseFloat(val2_str);
              }

              let inputValue = parseFloat(el.value.replace(/\s/g, ''));

              if (isNaN(inputValue)) return;

              if (el.id.includes('min')) {
                sliderElement.noUiSlider.set([inputValue, null]);
              } else {
                sliderElement.noUiSlider.set([null, inputValue]);
              }
            }
          }, 750);
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
          colorSlider.noUiSlider.on('start', function() {
            isSliderDragging = true;
            showImages();
          });

          colorSlider.noUiSlider.on('end', function() {
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

    // Check if all sliders are initialized and trigger initial load
    checkSlidersAndInitialize() {
      const state = window.DiamondSearchState;

      if (state.areAllSlidersInitialized() && !state.initialLoadComplete) {
        this.applyInitialFilters();
      }
    }
  };
}