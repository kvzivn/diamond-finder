// Diamond Renderer Module
if (typeof window !== 'undefined') {
  window.DiamondRenderer = {
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

    // Sort diamonds based on selected criteria
    sortDiamonds(diamonds, sortType) {
      const diamondsCopy = [...diamonds];

      switch (sortType) {
        case 'price-low-high':
          return diamondsCopy.sort((a, b) => {
            const priceA = a.totalPriceSek || a.totalPrice || 0;
            const priceB = b.totalPriceSek || b.totalPrice || 0;
            return priceA - priceB;
          });

        case 'price-high-low':
          return diamondsCopy.sort((a, b) => {
            const priceA = a.totalPriceSek || a.totalPrice || 0;
            const priceB = b.totalPriceSek || b.totalPrice || 0;
            return priceB - priceA;
          });

        case 'carat-low-high':
          return diamondsCopy.sort((a, b) => {
            const caratA = a.carat || 0;
            const caratB = b.carat || 0;
            return caratA - caratB;
          });

        case 'carat-high-low':
          return diamondsCopy.sort((a, b) => {
            const caratA = a.carat || 0;
            const caratB = b.carat || 0;
            return caratB - caratA;
          });

        default:
          return diamondsCopy;
      }
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

    // Create individual diamond card element
    async createDiamondCard(diamond) {
      const diamondCard = document.createElement('div');
      diamondCard.className =
        'tw-flex tw-flex-col tw-bg-white tw-border tw-rounded-lg tw-py-4 tw-px-6 tw-transition hover:tw-border-gray-300 hover:tw-shadow-md tw-overflow-hidden tw-cursor-pointer';

      // Make card clickable to show diamond details
      diamondCard.addEventListener('click', () => {
        if (window.DiamondDetails) {
          window.DiamondDetails.showDiamondDetails(diamond);
        }
      });

      // Image or SVG placeholder
      const carats =
        diamond.carat !== null && typeof diamond.carat === 'number'
          ? diamond.carat.toFixed(2)
          : 'Ej tillgänglig';
      const shape = this.translateShapeToSwedish(diamond.cut);
      const displayType = 'Diamant';

      let imageElement;

      if (diamond.imagePath) {
        // Use actual diamond image
        imageElement = document.createElement('img');
        imageElement.className =
          'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
        imageElement.src = diamond.imagePath;
        imageElement.alt = `${carats}ct ${shape} ${displayType}`;

        // Handle broken images by falling back to SVG icon or placeholder
        imageElement.onerror = () => {
          // Create parent container to replace the broken image
          const parentContainer = imageElement.parentNode;
          if (parentContainer) {
            let fallbackElement;

            if (window.DiamondShapeIcons) {
              // Use SVG icon for diamond shape
              fallbackElement = window.DiamondShapeIcons.createSvgElement(
                diamond.cut,
                'tw-w-full tw-h-48 tw-rounded-md tw-mb-4 tw-p-6 tw-flex tw-items-center tw-justify-center tw-opacity-60'
              );
            } else {
              // Use placeholder image as final fallback
              fallbackElement = document.createElement('img');
              fallbackElement.className =
                'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
              fallbackElement.src =
                'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
              fallbackElement.alt = `${carats}ct ${shape} ${displayType}`;
            }

            // Replace the broken image with the fallback
            parentContainer.replaceChild(fallbackElement, imageElement);
          }
        };
      } else if (window.DiamondShapeIcons) {
        // Use SVG icon for diamond shape (always available due to DEFAULT fallback)
        imageElement = window.DiamondShapeIcons.createSvgElement(
          diamond.cut,
          'tw-w-full tw-h-48 tw-rounded-md tw-mb-4 tw-p-6 tw-flex tw-items-center tw-justify-center tw-opacity-60'
        );
      } else {
        // Fallback to placeholder image if DiamondShapeIcons not available
        imageElement = document.createElement('img');
        imageElement.className =
          'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
        imageElement.src =
          'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';
        imageElement.alt = `${carats}ct ${shape} ${displayType}`;
      }

      // Title
      const title = document.createElement('h3');
      title.className =
        'tw-text-lg tw-font-semibold tw-mt-2 tw-truncate tw-text-center';
      title.textContent = `Diamant ${shape}`;

      // Subtitle with diamond details
      const subtitle = document.createElement('div');
      subtitle.className =
        'tw-flex tw-flex-col tw-space-y-1 tw-divide-y tw-divide-gray-100 tw-my-4 tw-text-sm tw-text-gray-600';

      const detailsData = [];
      // Add carat as the first detail
      detailsData.push({ label: 'Carat:', value: carats });
      detailsData.push({
        label: 'Färg:',
        value: this.formatDiamondColor(diamond),
      });
      if (diamond.clarity)
        detailsData.push({ label: 'Klarhet:', value: diamond.clarity });
      if (diamond.cutGrade)
        detailsData.push({ label: 'Slipkvalitet:', value: diamond.cutGrade });
      if (diamond.polish)
        detailsData.push({ label: 'Polering:', value: diamond.polish });
      if (diamond.symmetry)
        detailsData.push({ label: 'Symmetri:', value: diamond.symmetry });
      if (diamond.fluorescence)
        detailsData.push({
          label: 'Fluorescens:',
          value: diamond.fluorescence,
        });

      if (detailsData.length > 0) {
        detailsData.forEach((detail) => {
          const detailRow = document.createElement('div');
          detailRow.className = 'tw-flex tw-pt-1';

          const label = document.createElement('span');
          label.className = 'tw-w-1/2';
          label.textContent = detail.label;

          const value = document.createElement('span');
          value.className = 'tw-w-1/2 tw-text-right tw-text-gray-800';
          value.textContent = detail.value;

          detailRow.appendChild(label);
          detailRow.appendChild(value);
          subtitle.appendChild(detailRow);
        });
      } else {
        const detailRow = document.createElement('div');
        detailRow.className = 'tw-text-center';
        detailRow.textContent = 'Detaljer ej specificerade';
        subtitle.appendChild(detailRow);
      }

      // Price and certification container - improved layout with separate rows
      const priceCertContainer = document.createElement('div');
      priceCertContainer.className = 'tw-flex tw-flex-col tw-space-y-2 tw-mb-1';

      let originalPrice = 'Pris ej tillgängligt';
      let finalPrice = 'Pris ej tillgängligt';
      let displayCurrency = 'SEK';
      let markupApplied = false;

      // Apply markup using the new pricing module
      if (window.DiamondPricing && diamond.totalPriceSek) {
        try {
          const diamondWithMarkup =
            await window.DiamondPricing.applyMarkupToDiamond(diamond);

          // Round original price to nearest 100 SEK for consistency with markup price
          const roundedOriginalPrice =
            Math.round(diamond.totalPriceSek / 100) * 100;
          originalPrice = roundedOriginalPrice
            .toLocaleString('sv-SE')
            .replace(/,/g, ' ');

          if (
            diamondWithMarkup.finalPriceSek &&
            diamondWithMarkup.finalPriceSek > 0
          ) {
            finalPrice = diamondWithMarkup.finalPriceSek
              .toLocaleString('sv-SE')
              .replace(/,/g, ' ');
            markupApplied = diamondWithMarkup.markupApplied;
          } else {
            finalPrice = originalPrice; // Fallback to original price
          }
        } catch (error) {
          console.warn(
            '[DIAMOND RENDERER] Error applying markup, using base price:',
            error
          );
          // Fallback to base price for both
          const roundedOriginalPrice =
            Math.round(diamond.totalPriceSek / 100) * 100;
          originalPrice = roundedOriginalPrice
            .toLocaleString('sv-SE')
            .replace(/,/g, ' ');
          finalPrice = originalPrice;
        }
      } else if (
        diamond.totalPriceSek !== null &&
        typeof diamond.totalPriceSek === 'number'
      ) {
        // Fallback to base price if pricing module not available
        const roundedOriginalPrice =
          Math.round(diamond.totalPriceSek / 100) * 100;
        originalPrice = roundedOriginalPrice
          .toLocaleString('sv-SE')
          .replace(/,/g, ' ');
        finalPrice = originalPrice;
      } else if (
        diamond.totalPrice !== null &&
        typeof diamond.totalPrice === 'number'
      ) {
        originalPrice = diamond.totalPrice.toLocaleString();
        finalPrice = originalPrice;
        displayCurrency = 'USD';
      }

      // Original price row (always show if markup is applied)
      if (markupApplied && originalPrice !== finalPrice) {
        const originalPriceRow = document.createElement('div');
        originalPriceRow.className =
          'tw-flex tw-justify-between tw-items-center tw-text-sm';

        const originalPriceLabel = document.createElement('span');
        originalPriceLabel.className = 'tw-text-gray-500';
        originalPriceLabel.textContent = 'Ursprungspris:';

        const originalPriceValue = document.createElement('span');
        originalPriceValue.className = 'tw-text-gray-500';
        originalPriceValue.textContent = `${originalPrice} ${displayCurrency}`;

        originalPriceRow.appendChild(originalPriceLabel);
        originalPriceRow.appendChild(originalPriceValue);
        priceCertContainer.appendChild(originalPriceRow);
      }

      // Final price row (main price display)
      const finalPriceRow = document.createElement('div');
      finalPriceRow.className = 'tw-flex tw-justify-between tw-items-center';

      const finalPriceLabel = document.createElement('span');
      finalPriceLabel.className = 'tw-text-sm tw-text-gray-700';
      if (markupApplied && originalPrice !== finalPrice) {
        finalPriceLabel.textContent = 'Slutpris:';
      } else {
        finalPriceLabel.textContent = 'Pris:';
      }

      const finalPriceValue = document.createElement('span');
      finalPriceValue.className = 'tw-text-lg tw-font-bold tw-text-gray-900';
      finalPriceValue.textContent = `${finalPrice} ${displayCurrency}`;

      // Add markup indicator if applicable
      if (markupApplied && originalPrice !== finalPrice) {
        const markupIndicator = document.createElement('span');
        markupIndicator.className = 'tw-text-xs tw-text-green-600 tw-ml-1';
        markupIndicator.textContent = '(markup)';
        finalPriceValue.appendChild(markupIndicator);
      }

      finalPriceRow.appendChild(finalPriceLabel);
      finalPriceRow.appendChild(finalPriceValue);
      priceCertContainer.appendChild(finalPriceRow);

      // Certification row
      const certificationRow = document.createElement('div');
      certificationRow.className =
        'tw-flex tw-justify-between tw-items-center tw-text-sm';

      const certificationLabel = document.createElement('span');
      certificationLabel.className = 'tw-text-gray-700';
      certificationLabel.textContent = 'Certifiering:';

      const certificationValue = document.createElement('span');
      certificationValue.className = 'tw-text-gray-800';
      certificationValue.textContent = diamond.gradingLab
        ? `${diamond.gradingLab}`
        : 'Ej tillgänglig';

      certificationRow.appendChild(certificationLabel);
      certificationRow.appendChild(certificationValue);
      priceCertContainer.appendChild(certificationRow);

      // Add to cart button
      // const addButton = document.createElement('button');
      // addButton.className =
      //   'tw-w-full tw-bg-white tw-text-gray-800 tw-py-2 tw-px-4 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition-colors tw-text-base tw-mt-auto';
      // addButton.textContent = 'Lägg i varukorg';
      // addButton.onclick = () => {};

      // Assemble card
      diamondCard.appendChild(imageElement);
      diamondCard.appendChild(title);
      diamondCard.appendChild(subtitle);
      diamondCard.appendChild(priceCertContainer);
      // diamondCard.appendChild(addButton);

      return diamondCard;
    },

    // Main render function
    async renderDiamonds(diamondsToRender) {
      const state = window.DiamondSearchState;
      const gridArea = document.getElementById('diamond-grid-area');
      const resultsCountEl = document.getElementById('ds-results-count');

      if (!gridArea) return;

      // Remove loading animation
      gridArea.classList.remove('tw-opacity-60');
      gridArea.innerHTML = '';

      // Filter out diamonds with null prices as a final safeguard
      const validPriceDiamonds = diamondsToRender.filter((diamond) => {
        const hasValidPrice =
          (diamond.totalPriceSek && diamond.totalPriceSek > 0) ||
          (diamond.totalPrice && diamond.totalPrice > 0);
        if (!hasValidPrice) {
          console.warn(
            '[DIAMOND RENDERER] Filtered out diamond with null/invalid price:',
            diamond.itemId
          );
        }
        return hasValidPrice;
      });

      // Sort diamonds
      const sortedDiamonds = this.sortDiamonds(
        validPriceDiamonds,
        state.currentSort
      );

      if (!sortedDiamonds || sortedDiamonds.length === 0) {
        gridArea.innerHTML =
          '<p class="tw-text-center tw-text-gray-500 tw-py-16">Inga diamanter hittades.</p>';
      } else {
        const grid = document.createElement('div');
        grid.className =
          'tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6';
        gridArea.appendChild(grid);

        // Create diamond cards with proper async handling
        for (const diamond of sortedDiamonds) {
          const diamondCard = await this.createDiamondCard(diamond);
          grid.appendChild(diamondCard);
        }
      }

      // Update results count
      this.updateResultsCount(resultsCountEl, sortedDiamonds.length);
    },

    // Update results count display
    updateResultsCount(resultsCountEl, displayedCount) {
      const state = window.DiamondSearchState;

      if (
        resultsCountEl &&
        state.paginationInfo &&
        state.paginationInfo.totalDiamonds !== undefined
      ) {
        const currentlyShown = state.allDiamonds.length;
        const totalFiltered = state.paginationInfo.totalDiamonds;
        resultsCountEl.textContent = `Visar ${currentlyShown} av ${totalFiltered.toLocaleString()} diamanter`;
      } else if (resultsCountEl) {
        resultsCountEl.textContent = `${displayedCount} diamanter`;
      }
    },
  };
}
