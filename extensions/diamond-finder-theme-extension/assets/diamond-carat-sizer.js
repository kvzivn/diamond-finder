// Diamond Carat Sizer Module
if (typeof window !== 'undefined') {
  window.DiamondCaratSizer = {
    // Current diamond being displayed
    currentDiamond: null,
    
    // Slider instance
    slider: null,
    
    // Carat size bounds
    MIN_CARAT: 0.18,
    MAX_CARAT: 3.00,
    STEP: 0.02,
    
    // Reference values for interpolation
    REFERENCE_VALUES: {
      0.18: {
        diamondWidth: 14.049769689873655,
        clawTop: -11.2157,
        clawLeft: -0.784289,
        clawRotations: [45, -45, -135, -225]
      },
      1.00: {
        diamondWidth: 24.883513593310592,
        clawTop: -15.2375,
        clawLeft: 3.23753,
        clawRotations: [45, -45, -135, -225]
      },
      3.00: {
        diamondWidth: 35.88823678769076,
        clawTop: -19.3228,
        clawLeft: 7.32283,
        clawRotations: [45, -45, -135, -225]
      }
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
      
      // Set initial value based on diamond carat weight
      if (diamond && diamond.caratWeight) {
        const caratValue = Math.max(this.MIN_CARAT, Math.min(this.MAX_CARAT, diamond.caratWeight));
        if (this.slider) {
          this.slider.set(caratValue);
        }
      }
    },
    
    // Initialize the noUiSlider
    initializeSlider() {
      const sliderElement = document.getElementById('carat-sizer-slider');
      if (!sliderElement || !window.noUiSlider) {
        console.error('[CARAT SIZER] Slider element or noUiSlider not found');
        return;
      }
      
      // Create the slider
      this.slider = window.noUiSlider.create(sliderElement, {
        start: 1.00,
        connect: [true, false],
        range: {
          'min': this.MIN_CARAT,
          'max': this.MAX_CARAT
        },
        step: this.STEP,
        format: {
          to: (value) => value.toFixed(2),
          from: (value) => parseFloat(value)
        },
        tooltips: {
          to: (value) => `${value.toFixed(2)} ct`,
          from: (value) => parseFloat(value)
        }
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
      
      // Set initial display
      this.updateDisplay(1.00);
    },
    
    // Update diamond shape based on current diamond
    updateDiamondShape() {
      if (!this.currentDiamond) return;
      
      const diamondImage = document.getElementById('carat-diamond');
      if (!diamondImage) return;
      
      // Map shape names to image filenames
      const shapeMap = {
        'ROUND': 'round',
        'PRINCESS': 'princess',
        'EMERALD': 'emerald',
        'ASSCHER': 'asscher',
        'CUSHION': 'cushion',
        'OVAL': 'oval',
        'MARQUISE': 'marquise',
        'PEAR': 'pear',
        'HEART': 'diamond', // Heart shape not available, use diamond as fallback
        'RADIANT': 'radiant'
      };
      
      const shapeName = shapeMap[this.currentDiamond.cut?.toUpperCase()] || 'round';
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
      
      if (carat <= 1.00) {
        lowerRef = this.REFERENCE_VALUES[0.18];
        upperRef = this.REFERENCE_VALUES[1.00];
        lowerCarat = 0.18;
        upperCarat = 1.00;
      } else {
        lowerRef = this.REFERENCE_VALUES[1.00];
        upperRef = this.REFERENCE_VALUES[3.00];
        lowerCarat = 1.00;
        upperCarat = 3.00;
      }
      
      // Calculate interpolation factor
      const factor = (carat - lowerCarat) / (upperCarat - lowerCarat);
      
      // Interpolate values
      return {
        diamondWidth: this.lerp(lowerRef.diamondWidth, upperRef.diamondWidth, factor),
        clawTop: this.lerp(lowerRef.clawTop, upperRef.clawTop, factor),
        clawLeft: this.lerp(lowerRef.clawLeft, upperRef.clawLeft, factor),
        clawRotations: lowerRef.clawRotations // Rotations stay the same
      };
    },
    
    // Linear interpolation helper
    lerp(start, end, factor) {
      return start + (end - start) * factor;
    },
    
    // Update claw positions
    updateClaws(values) {
      const clawsContainer = document.getElementById('carat-claws');
      if (!clawsContainer) return;
      
      // Clear existing claws
      clawsContainer.innerHTML = '';
      
      // Calculate diamond radius for claw positioning
      const diamondRadius = values.diamondWidth / 2;
      const clawDistance = diamondRadius + 8; // Place claws slightly outside the diamond
      const clawSize = Math.max(8, diamondRadius * 0.4); // Scale claw size with diamond
      
      // Create 4 claws positioned around the diamond (top-right, top-left, bottom-left, bottom-right)
      const clawPositions = [
        { 
          top: -clawDistance * Math.sin(Math.PI / 4), 
          left: clawDistance * Math.cos(Math.PI / 4) 
        }, // top-right
        { 
          top: -clawDistance * Math.sin(Math.PI / 4), 
          left: -clawDistance * Math.cos(Math.PI / 4) 
        }, // top-left
        { 
          top: clawDistance * Math.sin(Math.PI / 4), 
          left: -clawDistance * Math.cos(Math.PI / 4) 
        }, // bottom-left
        { 
          top: clawDistance * Math.sin(Math.PI / 4), 
          left: clawDistance * Math.cos(Math.PI / 4) 
        }  // bottom-right
      ];
      
      values.clawRotations.forEach((rotation, index) => {
        const claw = document.createElement('img');
        claw.src = window.DiamondUtils.getAssetUrl('claw.png');
        claw.className = 'ring-claw';
        claw.style.position = 'absolute';
        claw.style.top = `${clawPositions[index].top}px`;
        claw.style.left = `${clawPositions[index].left}px`;
        claw.style.width = `${clawSize}px`;
        claw.style.height = `${clawSize}px`;
        claw.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
        claw.style.transformOrigin = 'center';
        clawsContainer.appendChild(claw);
      });
    },
    
    // Show the carat sizer tab
    show() {
      // Update tab states
      document.querySelectorAll('[id^="tab-"]').forEach(tab => {
        tab.classList.remove('tw-border-gray-600');
        tab.classList.add('tw-border-gray-200');
      });
      
      const caratTab = document.getElementById('tab-carat-sizer');
      if (caratTab) {
        caratTab.classList.remove('tw-border-gray-200');
        caratTab.classList.add('tw-border-gray-600');
      }
      
      // Update content visibility
      document.querySelectorAll('[id^="content-"]').forEach(content => {
        content.classList.add('tw-hidden');
      });
      
      const caratContent = document.getElementById('content-carat-sizer');
      if (caratContent) {
        caratContent.classList.remove('tw-hidden');
      }
    },
    
    // Clean up when leaving the view
    cleanup() {
      // Reset to default state if needed
      if (this.slider) {
        this.slider.set(1.00);
      }
    }
  };
  
  // Add utility function if not already available
  if (!window.DiamondUtils) {
    window.DiamondUtils = {};
  }
  
  if (!window.DiamondUtils.getAssetUrl) {
    window.DiamondUtils.getAssetUrl = function(path) {
      // This function will be overridden by the Liquid template with proper asset URLs
      console.error('[CARAT SIZER] Asset URL function should be defined in Liquid template');
      return path;
    };
  }
}