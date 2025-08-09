// Diamond Carat Sizer Module
if (typeof window !== 'undefined') {
  window.DiamondCaratSizer = {
    // Current diamond being displayed
    currentDiamond: null,

    // Slider instance
    slider: null,

    // Claw elements cache
    clawElements: [],

    // Carat size bounds
    MIN_CARAT: 0.18,
    MAX_CARAT: 3.0,
    STEP: 0.01,

    // Reference values for interpolation
    REFERENCE_VALUES: {
      0.18: {
        diamondWidth: 14,
        clawTop: -11.2157,
        clawLeft: -0.784289,
        clawRotations: [45, -45, -135, -225],
      },
      0.5: {
        diamondWidth: 18,
        clawTop: -15.2375,
        clawLeft: 3.23753,
        clawRotations: [45, -45, -135, -225],
      },
      1.0: {
        diamondWidth: 22,
        clawTop: -15.2375,
        clawLeft: 3.23753,
        clawRotations: [45, -45, -135, -225],
      },
      2.0: {
        diamondWidth: 26,
        clawTop: -17.8,
        clawLeft: 5.8,
        clawRotations: [45, -45, -135, -225],
      },
      3.0: {
        diamondWidth: 30,
        clawTop: -18.5,
        clawLeft: 6.5,
        clawRotations: [45, -45, -135, -225],
      },
    },

    // Initialize the carat sizer
    initialize(diamond) {
      this.currentDiamond = diamond;

      // Initialize slider if not already done
      if (!this.slider) {
        this.initializeSlider();
      }

      // Update diamond shape image if needed
      this.updateDiamondShape();

      // Use the diamond's actual carat value, clamped to slider bounds
      let initialCarat = 1.0; // Default fallback
      if (diamond && (diamond.carat || diamond.caratWeight)) {
        // Support both 'carat' and 'caratWeight' property names
        initialCarat = parseFloat(diamond.carat || diamond.caratWeight);
        // Clamp to slider bounds
        if (initialCarat < this.MIN_CARAT) {
          initialCarat = this.MIN_CARAT;
        } else if (initialCarat > this.MAX_CARAT) {
          initialCarat = this.MAX_CARAT;
        }
      }

      if (this.slider) {
        this.slider.set(initialCarat);
      }

      // Wait for images and DOM to be ready before positioning
      requestAnimationFrame(() => {
        this.updateDisplay(initialCarat);
      });
    },

    // Initialize the noUiSlider
    initializeSlider() {
      const sliderElement = document.getElementById('carat-sizer-slider');
      if (!sliderElement || !window.noUiSlider) {
        console.error('[CARAT SIZER] Slider element or noUiSlider not found');
        return;
      }

      // Determine initial value based on current diamond
      let initialValue = 1.0;
      if (this.currentDiamond && (this.currentDiamond.carat || this.currentDiamond.caratWeight)) {
        // Support both 'carat' and 'caratWeight' property names
        initialValue = parseFloat(this.currentDiamond.carat || this.currentDiamond.caratWeight);
        // Clamp to slider bounds
        if (initialValue < this.MIN_CARAT) {
          initialValue = this.MIN_CARAT;
        } else if (initialValue > this.MAX_CARAT) {
          initialValue = this.MAX_CARAT;
        }
      }

      // Create the slider
      this.slider = window.noUiSlider.create(sliderElement, {
        start: initialValue,
        connect: [true, false],
        range: {
          min: this.MIN_CARAT,
          max: this.MAX_CARAT,
        },
        step: this.STEP,
        format: {
          to: (value) => value.toFixed(2),
          from: (value) => parseFloat(value),
        },
        tooltips: {
          to: (value) => `${value.toFixed(2)} ct`,
          from: (value) => parseFloat(value),
        },
      });

      // Hide tooltip initially
      const tooltip = sliderElement.querySelector('.noUi-tooltip');
      if (tooltip) {
        tooltip.style.display = 'none';
      }

      // Show tooltip on start event
      this.slider.on('start', () => {
        const tooltip = sliderElement.querySelector('.noUi-tooltip');
        if (tooltip) {
          tooltip.style.display = 'block';
        }
      });

      // Hide tooltip on end event
      this.slider.on('end', () => {
        const tooltip = sliderElement.querySelector('.noUi-tooltip');
        if (tooltip) {
          tooltip.style.display = 'none';
        }
      });

      // Add event listener for slider changes
      this.slider.on('update', (values) => {
        const caratValue = parseFloat(values[0]);
        this.updateDisplay(caratValue);
      });

      // Wait for next animation frame to ensure DOM is ready
      requestAnimationFrame(() => {
        this.updateDisplay(initialValue);
      });
    },

    // Update diamond shape based on current diamond
    updateDiamondShape() {
      if (!this.currentDiamond) return;

      const diamondImage = document.getElementById('carat-diamond');
      if (!diamondImage) return;

      // Map shape names to image filenames
      const shapeMap = {
        ROUND: 'round',
        PRINCESS: 'princess',
        EMERALD: 'emerald',
        ASSCHER: 'asscher',
        CUSHION: 'cushion',
        OVAL: 'oval',
        MARQUISE: 'marquise',
        PEAR: 'pear',
        HEART: 'diamond', // Heart shape not available, use diamond as fallback
        RADIANT: 'radiant',
      };

      const shapeName =
        shapeMap[this.currentDiamond.cut?.toUpperCase()] || 'round';
      const imagePath = window.DiamondUtils.getAssetUrl(`${shapeName}.png`);

      if (imagePath) {
        diamondImage.src = imagePath;
      }
    },

    // Update the display based on carat value
    updateDisplay(caratValue) {
      // Calculate interpolated values
      const values = this.interpolateValues(caratValue);

      // Update diamond size
      const diamondImage = document.getElementById('carat-diamond');
      if (diamondImage) {
        diamondImage.style.width = `${values.diamondWidth}px`;
      }

      // Update claws
      this.updateClaws(values);
    },

    // Interpolate values based on carat weight
    interpolateValues(carat) {
      // Linear interpolation between reference points
      let lowerRef, upperRef, lowerCarat, upperCarat;

      if (carat <= 0.5) {
        lowerRef = this.REFERENCE_VALUES[0.18];
        upperRef = this.REFERENCE_VALUES[0.5];
        lowerCarat = 0.18;
        upperCarat = 0.5;
      } else if (carat <= 1.0) {
        lowerRef = this.REFERENCE_VALUES[0.5];
        upperRef = this.REFERENCE_VALUES[1.0];
        lowerCarat = 0.5;
        upperCarat = 1.0;
      } else if (carat <= 2.0) {
        lowerRef = this.REFERENCE_VALUES[1.0];
        upperRef = this.REFERENCE_VALUES[2.0];
        lowerCarat = 1.0;
        upperCarat = 2.0;
      } else {
        lowerRef = this.REFERENCE_VALUES[2.0];
        upperRef = this.REFERENCE_VALUES[3.0];
        lowerCarat = 2.0;
        upperCarat = 3.0;
      }

      // Calculate interpolation factor
      const factor = (carat - lowerCarat) / (upperCarat - lowerCarat);

      // Interpolate values
      return {
        diamondWidth: this.lerp(
          lowerRef.diamondWidth,
          upperRef.diamondWidth,
          factor
        ),
        clawTop: this.lerp(lowerRef.clawTop, upperRef.clawTop, factor),
        clawLeft: this.lerp(lowerRef.clawLeft, upperRef.clawLeft, factor),
        clawRotations: lowerRef.clawRotations, // Rotations stay the same
      };
    },

    // Linear interpolation helper
    lerp(start, end, factor) {
      return start + (end - start) * factor;
    },

    // Initialize claws (create once)
    initializeClaws(initialValues = null) {
      const clawsContainer = document.getElementById('carat-claws');
      if (!clawsContainer) {
        console.error('[CARAT SIZER] Claws container not found');
        return;
      }

      // Clear any existing claws and reset cache
      clawsContainer.innerHTML = '';
      this.clawElements = [];

      // Define rotations for each claw position
      const rotations = [45, -45, -135, 135];

      // Create 4 claw elements
      for (let i = 0; i < 4; i++) {
        const claw = document.createElement('img');
        const clawUrl = window.DiamondUtils.getAssetUrl('claw.png');

        if (!clawUrl || clawUrl === 'claw.png') {
          console.error('[CARAT SIZER] Claw image URL not properly resolved');
          return;
        }

        claw.src = clawUrl;
        claw.className = 'ring-claw';
        claw.style.position = 'absolute';
        claw.style.transformOrigin = 'center';
        claw.dataset.rotation = rotations[i]; // Store rotation for later use
        claw.style.opacity = '0.9';

        clawsContainer.appendChild(claw);
        this.clawElements.push(claw);
      }

      // If initial values provided, position immediately
      if (initialValues) {
        this.positionClaws(initialValues);
      }
    },

    // Position claws based on current values
    positionClaws(values) {
      if (this.clawElements.length === 0) {
        return;
      }

      // Get the diamond container to calculate relative positions
      const diamondContainer = document.querySelector(
        '.carat-diamond-container'
      );
      if (!diamondContainer) {
        console.error('[CARAT SIZER] Diamond container not found');
        return;
      }

      // Calculate diamond radius for claw positioning
      const diamondRadius = values.diamondWidth / 2;
      const clawDistance = diamondRadius + 2; // Place claws very close to the diamond
      const clawSize = Math.max(10, Math.min(20, diamondRadius * 0.5)); // Scale claw size with diamond

      // Get container center (relative to the claws container)
      const containerWidth = diamondContainer.offsetWidth;
      const containerHeight = diamondContainer.offsetHeight;
      const centerX = containerWidth / 2;
      const centerY = containerHeight / 2;

      // Calculate positions for 4 claws (top-right, top-left, bottom-left, bottom-right)
      const angles = [
        Math.PI / 4,
        (3 * Math.PI) / 4,
        (5 * Math.PI) / 4,
        (7 * Math.PI) / 4,
      ];

      // Update each claw's position and size
      this.clawElements.forEach((claw, index) => {
        const angle = angles[index];
        const top = centerY - clawDistance * Math.sin(angle);
        const left = centerX + clawDistance * Math.cos(angle);
        const rotation = claw.dataset.rotation;

        // Update styles without recreating the element
        claw.style.top = `${top}px`;
        claw.style.left = `${left}px`;
        claw.style.width = `${clawSize}px`;
        claw.style.height = `${clawSize}px`;
        claw.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
      });
    },

    // Update claw positions (no DOM manipulation, just style updates)
    updateClaws(values) {
      // Initialize claws if not already done, passing initial values
      if (this.clawElements.length === 0) {
        this.initializeClaws(values);
        return; // Positioning already done in initializeClaws
      }

      // Position the claws
      this.positionClaws(values);
    },

    // Show the carat sizer tab
    show() {
      // Update tab states
      document.querySelectorAll('[id^="tab-"]').forEach((tab) => {
        tab.classList.remove('tw-border-gray-600');
        tab.classList.add('tw-border-gray-200');
      });

      const caratTab = document.getElementById('tab-carat-sizer');
      if (caratTab) {
        caratTab.classList.remove('tw-border-gray-200');
        caratTab.classList.add('tw-border-gray-600');
      }

      // Update content visibility
      document.querySelectorAll('[id^="content-"]').forEach((content) => {
        content.classList.add('tw-hidden');
      });

      const caratContent = document.getElementById('content-carat-sizer');
      if (caratContent) {
        caratContent.classList.remove('tw-hidden');
      }

      // Ensure display is updated when showing the tab
      requestAnimationFrame(() => {
        this.updateDisplay(this.slider ? parseFloat(this.slider.get()) : 1.0);
      });
    },

    // Clean up when leaving the view
    cleanup() {
      // Reset to default state if needed
      if (this.slider) {
        this.slider.set(1.0);
      }
      // Clear claw elements cache
      this.clawElements = [];
    },
  };

  // Add utility function if not already available
  if (!window.DiamondUtils) {
    window.DiamondUtils = {};
  }

  if (!window.DiamondUtils.getAssetUrl) {
    window.DiamondUtils.getAssetUrl = function (path) {
      // This function will be overridden by the Liquid template with proper asset URLs
      console.error(
        '[CARAT SIZER] Asset URL function should be defined in Liquid template'
      );
      return path;
    };
  }
}
