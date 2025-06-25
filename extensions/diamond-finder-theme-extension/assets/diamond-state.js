// Diamond Search State Management Module
if (typeof window !== 'undefined') {
  // Initialize global state
  window.DiamondSearchState = {
    // Data state
    allDiamonds: [],
    paginationInfo: {},

    // Filter state
    activeFilters: {},

    // UI state
    currentSort: 'price-low-high',
    isLoadingMore: false,
    initialLoadComplete: false,

    // Slider state
    sliderInitializationState: {
      price: false,
      carat: false,
      colour: false,
      clarity: false,
      cutGrade: false,
      fluorescence: false,
      polish: false,
      symmetry: false,
      table: false,
      ratio: false,
      fancyIntensity: false,
    },

    // Configuration constants
    DEFAULT_FILTER_RANGES: {
      price: [2500, 10000000], // SEK range
      carat: [0.5, 20.0],
      colour: ['K', 'D_MAX'],
      clarity: ['SI2', 'FL_MAX'],
      cutGrade: ['Good', 'Excellent_MAX'],
      fluorescence: ['Very Strong', 'None_MAX'],
      polish: ['Good', 'Excellent_MAX'],
      symmetry: ['Good', 'Excellent_MAX'],
      table: [0, 100], // Percentage range
      ratio: [0.8, 3.0], // Ratio range
      fancyIntensity: ['Fancy Deep', 'Faint_MAX'],
    },

    FILTER_LABELS: {
      colour: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D'],
      clarity: ['SI2', 'SI1', 'VS2', 'VS1', 'VVS2', 'VVS1', 'IF', 'FL'],
      cutGrade: ['Good', 'Very Good', 'Excellent'],
      fluorescence: ['Very Strong', 'Strong', 'Medium', 'Faint', 'None'],
      polish: ['Good', 'Very Good', 'Excellent'],
      symmetry: ['Good', 'Very Good', 'Excellent'],
      fancyIntensity: [
        'Fancy Deep',
        'Fancy',
        'Fancy Intense',
        'Fancy Dark',
        'Fancy Light',
        'Light',
        'Very Light',
        'Faint',
      ],
    },
  };

  // State management functions
  window.DiamondSearchState.updateSort = function (newSort) {
    this.currentSort = newSort;
  };

  window.DiamondSearchState.setFilter = function (key, value) {
    this.activeFilters[key] = value;
  };

  window.DiamondSearchState.getFilter = function (key) {
    return this.activeFilters[key];
  };

  window.DiamondSearchState.clearFilters = function () {
    this.activeFilters = {};
  };

  window.DiamondSearchState.markSliderInitialized = function (sliderType) {
    this.sliderInitializationState[sliderType] = true;
  };

  window.DiamondSearchState.areAllSlidersInitialized = function () {
    return Object.values(this.sliderInitializationState).every(
      (state) => state === true
    );
  };

  window.DiamondSearchState.setDiamonds = function (
    diamonds,
    isLoadMore = false
  ) {
    if (isLoadMore) {
      this.allDiamonds = [...this.allDiamonds, ...diamonds];
    } else {
      this.allDiamonds = diamonds;
    }
  };

  window.DiamondSearchState.setPaginationInfo = function (info) {
    this.paginationInfo = info;
  };

  // Utility functions
  window.DiamondSearchState.logCurrentFilters = function (
    prefix = '[FILTERS APPLIED]'
  ) {
    const sliderValues = window.DiamondFilters
      ? window.DiamondFilters.getSliderValues()
      : {};
    const allFilters = { ...this.activeFilters, sliders: sliderValues };
    console.log(prefix, allFilters);
    console.log(sliderValues);
  };
}
