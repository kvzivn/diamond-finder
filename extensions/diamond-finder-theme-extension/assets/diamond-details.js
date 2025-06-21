// Diamond Details Module
if (typeof window !== 'undefined') {
  window.DiamondDetails = {
    // Helper function to format fancy colors
    formatDiamondColor(diamond) {
      // Check if diamond has fancy color
      if (
        diamond.naturalFancyColor &&
        diamond.naturalFancyColor.trim() !== ''
      ) {
        const fancyColor = diamond.naturalFancyColor.trim();
        const intensity = diamond.naturalFancyColorIntensity
          ? diamond.naturalFancyColorIntensity.trim()
          : '';

        // If there's an intensity, combine it with the color
        if (intensity) {
          return `${intensity} ${fancyColor}`;
        } else {
          // Just return the fancy color if no intensity
          return fancyColor;
        }
      }

      // Fall back to regular color if no fancy color
      return diamond.color || 'Ej tillgänglig';
    },

    // Helper function to translate diamond shape names to Swedish
    translateShapeToSwedish(englishShape) {
      const shapeTranslations = {
        ROUND: 'Rund',
        PRINCESS: 'Princess',
        CUSHION: 'Kudde',
        EMERALD: 'Smaragd',
        OVAL: 'Oval',
        RADIANT: 'Radiant',
        ASSCHER: 'Asscher',
        MARQUISE: 'Marquise',
        HEART: 'Hjärta',
        PEAR: 'Päron',
      };

      return (
        shapeTranslations[englishShape?.toUpperCase()] ||
        englishShape ||
        'Okänd'
      );
    },

    // Show diamond details view
    showDiamondDetails(diamond) {
      const searchView = document.getElementById('diamond-search-view');
      const detailsView = document.getElementById('diamond-details-view');

      if (!searchView || !detailsView) return;

      // Hide search view and show details view
      searchView.classList.add('tw-hidden');
      detailsView.classList.remove('tw-hidden');

      // Populate diamond details
      this.populateDiamondDetails(diamond);

      // Scroll to top
      window.scrollTo(0, 0);
    },

    // Hide diamond details view and show search
    hideDiamondDetails() {
      const searchView = document.getElementById('diamond-search-view');
      const detailsView = document.getElementById('diamond-details-view');

      if (!searchView || !detailsView) return;

      // Show search view and hide details view
      detailsView.classList.add('tw-hidden');
      searchView.classList.remove('tw-hidden');

      // Scroll to top
      window.scrollTo(0, 0);
    },

    // Populate diamond details in the view
    populateDiamondDetails(diamond) {
      // Update image or SVG
      const imageContainer = document.getElementById('diamond-details-image');
      if (imageContainer) {
        const carats =
          diamond.carat !== null && typeof diamond.carat === 'number'
            ? diamond.carat.toFixed(2)
            : 'Ej tillgänglig';
        const shape = this.translateShapeToSwedish(diamond.cut);
        const displayType = 'Diamant';
        const altText = `${carats}ct ${shape} ${displayType}`;

        if (diamond.imagePath) {
          // Use actual diamond image
          const imageElement = document.createElement('img');
          imageElement.className =
            'tw-w-full tw-h-full tw-object-cover tw-border tw-bg-white';
          imageElement.src = diamond.imagePath;
          imageElement.alt = altText;
          imageElement.width = '100%';
          imageElement.height = '100%';

          // Handle broken images by falling back to SVG icon or placeholder
          imageElement.onerror = () => {
            let fallbackElement;

            if (window.DiamondShapeIcons) {
              // Use SVG icon for diamond shape
              fallbackElement = window.DiamondShapeIcons.createSvgElement(
                diamond.cut,
                'tw-w-full tw-h-full tw-border tw-p-8 tw-flex tw-items-center tw-justify-center tw-opacity-60'
              );
            } else {
              // Use placeholder image as final fallback
              fallbackElement = document.createElement('img');
              fallbackElement.className =
                'tw-w-full tw-h-auto tw-object-cover tw-border';
              fallbackElement.src =
                'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
              fallbackElement.alt = altText;
              fallbackElement.width = '100%';
              fallbackElement.height = '100%';
            }

            // Replace the broken image with the fallback
            if (imageContainer.parentNode) {
              imageContainer.parentNode.replaceChild(
                fallbackElement,
                imageContainer
              );
              fallbackElement.id = 'diamond-details-image';
            }
          };

          // Clear container and add image
          imageContainer.innerHTML = '';
          imageContainer.appendChild(imageElement);
        } else if (window.DiamondShapeIcons) {
          // Use SVG icon for diamond shape when no image path
          const svgElement = window.DiamondShapeIcons.createSvgElement(
            diamond.cut,
            'tw-w-full tw-h-full tw-border tw-p-8 tw-flex tw-items-center tw-justify-center tw-opacity-60'
          );

          // Clear container and add SVG
          imageContainer.innerHTML = '';
          imageContainer.appendChild(svgElement);
        } else {
          // Fallback to placeholder image if DiamondShapeIcons not available
          const placeholderImg = document.createElement('img');
          placeholderImg.className =
            'tw-w-full tw-h-auto tw-object-cover tw-border';
          placeholderImg.src =
            'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
          placeholderImg.alt = altText;
          placeholderImg.width = '100%';
          placeholderImg.height = '100%';

          // Clear container and add placeholder
          imageContainer.innerHTML = '';
          imageContainer.appendChild(placeholderImg);
        }
      }

      // Update title
      const title = document.getElementById('diamond-details-title');
      if (title) {
        const shapeName = this.translateShapeToSwedish(diamond.cut);
        title.textContent = `Diamant ${shapeName}`;
      }

      // Update price
      const price = document.getElementById('diamond-details-price');
      if (price) {
        let displayPrice = 'Pris ej tillgängligt';
        if (
          diamond.totalPriceSek !== null &&
          typeof diamond.totalPriceSek === 'number'
        ) {
          const roundedPrice = Math.round(diamond.totalPriceSek / 100) * 100;
          displayPrice = `${roundedPrice.toLocaleString('sv-SE').replace(/,/g, ' ')} SEK`;
        } else if (
          diamond.totalPrice !== null &&
          typeof diamond.totalPrice === 'number'
        ) {
          displayPrice = `${diamond.totalPrice.toLocaleString()} USD`;
        }
        price.textContent = displayPrice;
      }

      // Update specifications
      const specsContainer = document.getElementById('diamond-details-specs');
      if (specsContainer) {
        specsContainer.innerHTML = '';

        const specs = [
          {
            label: 'SLIPNING:',
            value:
              this.translateShapeToSwedish(diamond.cut) || 'Ej tillgänglig',
          },
          { label: 'KARAT:', value: diamond.carat || 'Ej tillgänglig' },
          { label: 'FÄRG:', value: this.formatDiamondColor(diamond) },
          { label: 'KLARHET:', value: diamond.clarity || 'Ej tillgänglig' },
          { label: 'SLIPKVALITET:', value: diamond.cutGrade || 'Ingen' },
          { label: 'SYMMETRI:', value: diamond.symmetry || 'Ej tillgänglig' },
          { label: 'POLERING:', value: diamond.polish || 'Ej tillgänglig' },
          {
            label: 'CERTIFIKAT NUMMER:',
            value: diamond.certificateNumber || 'Ej tillgänglig',
          },
          {
            label: 'MÅTT:',
            value:
              diamond.measurementsLength &&
              diamond.measurementsWidth &&
              diamond.measurementsHeight
                ? `${diamond.measurementsLength} × ${diamond.measurementsWidth} × ${diamond.measurementsHeight}`
                : 'Ej tillgänglig',
          },
          {
            label: 'BORD BREDD %:',
            value: diamond.tablePercent || 'Ej tillgänglig',
          },
          {
            label: 'TOTAL DJUP %:',
            value: diamond.depthPercent || 'Ej tillgänglig',
          },
          {
            label: 'RUNDIST:',
            value:
              diamond.girdleFrom && diamond.girdleTo
                ? `${diamond.girdleFrom} - ${diamond.girdleTo}`
                : 'Ej tillgänglig',
          },
          {
            label: 'FLUORESCENS:',
            value: diamond.fluorescenceIntensity || 'Ingen',
          },
        ];

        specs.forEach((spec) => {
          const specRow = document.createElement('div');
          specRow.className = 'tw-flex tw-justify-between tw-pt-3';

          const label = document.createElement('span');
          label.className = 'tw-text-gray-600 tw-font-medium tw-text-sm';
          label.textContent = spec.label;

          const value = document.createElement('span');
          value.className = 'tw-text-gray-800 tw-text-sm';
          value.textContent = spec.value;

          specRow.appendChild(label);
          specRow.appendChild(value);
          specsContainer.appendChild(specRow);
        });
      }
    },

    // Initialize details view functionality
    initialize() {
      const backButton = document.getElementById('back-to-gallery');
      if (backButton) {
        backButton.addEventListener('click', () => {
          this.hideDiamondDetails();
        });
      }
    },
  };
}
