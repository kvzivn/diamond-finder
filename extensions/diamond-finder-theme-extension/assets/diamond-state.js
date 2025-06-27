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

    // Track which sliders have been changed by the user
    sliderChangedState: {
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
      carat: [0.3, 30.0],
      colour: ['K', 'D_MAX'], // Revert back to K as requested
      clarity: ['SI2', 'FL_MAX'],
      cutGrade: ['Good', 'Excellent_MAX'],
      fluorescence: ['None', 'Very Strong_MAX'],
      polish: ['Good', 'Excellent_MAX'],
      symmetry: ['Good', 'Excellent_MAX'],
      table: [0, 100], // Percentage range
      ratio: [0.8, 3.0], // Ratio range
      fancyIntensity: ['Light', 'Dark_MAX'],
    },

    FILTER_LABELS: {
      colour: ['K', 'J', 'I', 'H', 'G', 'F', 'E', 'D', 'D_MAX'],
      clarity: [
        'SI2',
        'SI1',
        'VS2',
        'VS1',
        'VVS2',
        'VVS1',
        'IF',
        'FL',
        'FL_MAX',
      ],
      cutGrade: ['Good', 'Very Good', 'Excellent', 'Excellent_MAX'],
      fluorescence: [
        'None',
        'Faint',
        'Medium',
        'Strong',
        'Very Strong',
        'Very Strong_MAX',
      ],
      polish: ['Good', 'Very Good', 'Excellent', 'Excellent_MAX'],
      symmetry: ['Good', 'Very Good', 'Excellent', 'Excellent_MAX'],
      fancyIntensity: [
        'Light',
        'Fancy',
        'Intense',
        'Vivid',
        'Deep',
        'Dark',
        'Dark_MAX',
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
    // Reset slider changed states for advanced filters
    this.sliderChangedState.fluorescence = false;
    this.sliderChangedState.polish = false;
    this.sliderChangedState.symmetry = false;
    this.sliderChangedState.table = false;
    this.sliderChangedState.ratio = false;
    this.sliderChangedState.fancyIntensity = false;
  };

  window.DiamondSearchState.markSliderInitialized = function (sliderType) {
    this.sliderInitializationState[sliderType] = true;
  };

  window.DiamondSearchState.markSliderChanged = function (sliderType) {
    this.sliderChangedState[sliderType] = true;
  };

  window.DiamondSearchState.hasSliderChanged = function (sliderType) {
    return this.sliderChangedState[sliderType] === true;
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

  window.DiamondSearchState.resetSliderChangedState = function (sliderType) {
    if (sliderType) {
      this.sliderChangedState[sliderType] = false;
    } else {
      // Reset all slider changed states
      Object.keys(this.sliderChangedState).forEach((key) => {
        this.sliderChangedState[key] = false;
      });
    }
  };

  // Utility functions
  window.DiamondSearchState.logCurrentFilters = function (
    prefix = '[INITIAL FILTERS]'
  ) {
    const sliderValues = window.DiamondFilters
      ? window.DiamondFilters.getSliderValues()
      : {};

    // Only include advanced filters if they've been changed by the user
    const appliedSliderValues = {
      price: sliderValues.price,
      carat: sliderValues.carat,
      colour: sliderValues.colour,
      clarity: sliderValues.clarity,
      cutGrade: sliderValues.cutGrade,
    };

    // Add advanced filters only if they've been changed
    if (this.hasSliderChanged('fluorescence') && sliderValues.fluorescence) {
      appliedSliderValues.fluorescence = sliderValues.fluorescence;
    }
    if (this.hasSliderChanged('polish') && sliderValues.polish) {
      appliedSliderValues.polish = sliderValues.polish;
    }
    if (this.hasSliderChanged('symmetry') && sliderValues.symmetry) {
      appliedSliderValues.symmetry = sliderValues.symmetry;
    }
    if (this.hasSliderChanged('table') && sliderValues.table) {
      appliedSliderValues.table = sliderValues.table;
    }
    if (this.hasSliderChanged('ratio') && sliderValues.ratio) {
      appliedSliderValues.ratio = sliderValues.ratio;
    }
    if (
      this.hasSliderChanged('fancyIntensity') &&
      sliderValues.fancyIntensity
    ) {
      appliedSliderValues.fancyIntensity = sliderValues.fancyIntensity;
    }

    // Include fancy color related values if applicable
    if (sliderValues.fancyColours) {
      appliedSliderValues.fancyColours = sliderValues.fancyColours;
    }
    if (sliderValues.colourType) {
      appliedSliderValues.colourType = sliderValues.colourType;
    }

    const allFilters = { ...this.activeFilters, sliders: appliedSliderValues };
    console.log(prefix, allFilters);
  };
}
