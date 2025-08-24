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

      if (
        (diamond.imagePath &&
          diamond.imagePath.trim() !== '' &&
          diamond.imagePath !== 'null') ||
        (diamond.imageUrl &&
          diamond.imageUrl.trim() !== '' &&
          diamond.imageUrl !== 'null')
      ) {
        // Use actual diamond image
        imageElement = document.createElement('img');
        imageElement.className =
          'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
        imageElement.src =
          diamond.imagePath &&
          diamond.imagePath.trim() !== '' &&
          diamond.imagePath !== 'null'
            ? diamond.imagePath
            : diamond.imageUrl;
        imageElement.alt = `${carats}ct ${shape} ${displayType}`;

        // Handle broken images by falling back to SVG icon or placeholder
        imageElement.onerror = () => {
          const state = window.DiamondSearchState;

          // If showNoImage is false (default), hide this diamond completely
          if (!state.showNoImage) {
            const cardElement = imageElement.closest(
              '.tw-flex.tw-flex-col.tw-bg-white.tw-border.tw-rounded-lg'
            );
            if (cardElement) {
              cardElement.style.display = 'none';
            }
            return;
          }

          // Otherwise, show SVG fallback
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
      if (diamond.gradingLab)
        detailsData.push({ label: 'Certifiering:', value: diamond.gradingLab });
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

      let priceWithMarkup = null;
      let finalPrice = 'Pris ej tillgängligt';
      let displayCurrency = 'SEK';
      let diamondWithMarkup = null;

      // Apply markup using the new pricing module
      if (window.DiamondPricing && diamond.totalPriceSek) {
        try {
          diamondWithMarkup =
            await window.DiamondPricing.applyMarkupToDiamond(diamond);

          if (
            diamondWithMarkup.finalPriceSek &&
            diamondWithMarkup.finalPriceSek > 0
          ) {
            // Calculate the unrounded price with markup
            if (
              diamondWithMarkup._debugInfo &&
              diamondWithMarkup._debugInfo.multiplier
            ) {
              priceWithMarkup =
                diamond.totalPriceSek * diamondWithMarkup._debugInfo.multiplier;
            } else {
              priceWithMarkup = diamondWithMarkup.finalPriceSek;
            }
            // Round final price to nearest 100 SEK
            finalPrice =
              Math.round(diamondWithMarkup.finalPriceSek / 100) * 100;
          } else {
            // Fallback to original price, rounded
            finalPrice = Math.round(diamond.totalPriceSek / 100) * 100;
          }
        } catch (error) {
          console.warn(
            '[DIAMOND RENDERER] Error applying markup, using base price:',
            error
          );
          // Fallback to base price, rounded
          finalPrice = Math.round(diamond.totalPriceSek / 100) * 100;
        }
      } else if (
        diamond.totalPriceSek !== null &&
        typeof diamond.totalPriceSek === 'number'
      ) {
        // Fallback to base price if pricing module not available, rounded
        finalPrice = Math.round(diamond.totalPriceSek / 100) * 100;
      } else if (
        diamond.totalPrice !== null &&
        typeof diamond.totalPrice === 'number'
      ) {
        finalPrice = diamond.totalPrice;
        displayCurrency = 'USD';
      }

      // Add original USD price row for transparency/debugging
      if (
        diamond.totalPrice !== null &&
        typeof diamond.totalPrice === 'number'
      ) {
        const usdPriceRow = document.createElement('div');
        usdPriceRow.className = 'tw-flex tw-justify-between tw-items-center';

        const usdPriceLabel = document.createElement('span');
        usdPriceLabel.className = 'tw-text-sm tw-text-gray-700';
        usdPriceLabel.textContent = 'Originalpris (USD):';

        const usdPriceValue = document.createElement('span');
        usdPriceValue.className = 'tw-text-lg tw-font-bold tw-text-gray-900';
        usdPriceValue.textContent = `$${diamond.totalPrice.toLocaleString()}`;

        usdPriceRow.appendChild(usdPriceLabel);
        usdPriceRow.appendChild(usdPriceValue);
        priceCertContainer.appendChild(usdPriceRow);
      }

      // Add converted SEK price row (non-rounded) for transparency
      if (
        diamond.totalPriceSek !== null &&
        typeof diamond.totalPriceSek === 'number'
      ) {
        const sekConvertedRow = document.createElement('div');
        sekConvertedRow.className =
          'tw-flex tw-justify-between tw-items-center';

        const sekConvertedLabel = document.createElement('span');
        sekConvertedLabel.className = 'tw-text-sm tw-text-gray-700';
        sekConvertedLabel.textContent = 'SEK (konverterat):';

        const sekConvertedValue = document.createElement('span');
        sekConvertedValue.className =
          'tw-text-lg tw-font-bold tw-text-gray-900';
        // Display the exact converted value without rounding
        sekConvertedValue.textContent = `${diamond.totalPriceSek.toFixed(2).replace('.', ',')} SEK`;

        sekConvertedRow.appendChild(sekConvertedLabel);
        sekConvertedRow.appendChild(sekConvertedValue);
        priceCertContainer.appendChild(sekConvertedRow);
      }

      // Add price with markup (show even if multiplier is 1.0, to display exact value)
      if (priceWithMarkup !== null) {
        const markupPriceRow = document.createElement('div');
        markupPriceRow.className = 'tw-flex tw-justify-between tw-items-center';

        const markupPriceLabel = document.createElement('span');
        markupPriceLabel.className = 'tw-text-sm tw-text-gray-700';

        // Calculate markup percentage from the multiplier
        let markupPercentage = 0;
        if (
          diamondWithMarkup &&
          diamondWithMarkup._debugInfo &&
          diamondWithMarkup._debugInfo.multiplier
        ) {
          markupPercentage = Math.round(
            (diamondWithMarkup._debugInfo.multiplier - 1) * 100
          );
        }

        // Display the markup percentage in the label
        if (markupPercentage > 0) {
          markupPriceLabel.textContent = `Efter påslag (${markupPercentage}%):`;
        } else {
          markupPriceLabel.textContent = 'Efter påslag (0%):';
        }

        const markupPriceValue = document.createElement('span');
        markupPriceValue.className = 'tw-text-lg tw-font-bold tw-text-gray-900';
        markupPriceValue.textContent = `${priceWithMarkup.toFixed(2).replace('.', ',')} SEK`;

        markupPriceRow.appendChild(markupPriceLabel);
        markupPriceRow.appendChild(markupPriceValue);
        priceCertContainer.appendChild(markupPriceRow);
      } else if (
        diamond.totalPriceSek !== null &&
        typeof diamond.totalPriceSek === 'number'
      ) {
        // If no markup was applied, still show the exact value as "Efter påslag"
        const markupPriceRow = document.createElement('div');
        markupPriceRow.className = 'tw-flex tw-justify-between tw-items-center';

        const markupPriceLabel = document.createElement('span');
        markupPriceLabel.className = 'tw-text-sm tw-text-gray-700';
        markupPriceLabel.textContent = 'Efter påslag (0%):';

        const markupPriceValue = document.createElement('span');
        markupPriceValue.className = 'tw-text-lg tw-font-bold tw-text-gray-900';
        markupPriceValue.textContent = `${diamond.totalPriceSek.toFixed(2).replace('.', ',')} SEK`;

        markupPriceRow.appendChild(markupPriceLabel);
        markupPriceRow.appendChild(markupPriceValue);
        priceCertContainer.appendChild(markupPriceRow);
      }

      // Final price row (rounded to nearest 100)
      if (
        typeof finalPrice === 'number' ||
        finalPrice !== 'Pris ej tillgängligt'
      ) {
        const finalPriceRow = document.createElement('div');
        finalPriceRow.className = 'tw-flex tw-justify-between tw-items-center';

        const finalPriceLabel = document.createElement('span');
        finalPriceLabel.className = 'tw-text-sm tw-text-gray-700';
        finalPriceLabel.textContent = 'Slutpris (avrundat):';

        const finalPriceValue = document.createElement('span');
        finalPriceValue.className = 'tw-text-lg tw-font-bold tw-text-gray-900';

        if (typeof finalPrice === 'number') {
          finalPriceValue.textContent = `${finalPrice.toLocaleString('sv-SE').replace(/,/g, ' ')} ${displayCurrency}`;
        } else {
          finalPriceValue.textContent = finalPrice;
        }

        finalPriceRow.appendChild(finalPriceLabel);
        finalPriceRow.appendChild(finalPriceValue);
        priceCertContainer.appendChild(finalPriceRow);
      }

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
      let validPriceDiamonds = diamondsToRender.filter((diamond) => {
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

      // Apply client-side finalPriceSek filtering
      const priceSliderEl = document.getElementById('ds-price-slider');
      if (priceSliderEl && priceSliderEl.noUiSlider) {
        const priceValues = priceSliderEl.noUiSlider.get();
        if (priceValues && priceValues.length === 2) {
          const minPrice = parseFloat(String(priceValues[0]).replace(/\s/g, ''));
          const maxPrice = parseFloat(String(priceValues[1]).replace(/\s/g, ''));
          
          if (!isNaN(minPrice) || !isNaN(maxPrice)) {
            const beforePriceFilterCount = validPriceDiamonds.length;
            validPriceDiamonds = await Promise.all(
              validPriceDiamonds.map(async (diamond) => {
                try {
                  // Calculate finalPriceSek with markup
                  let finalPriceSek = diamond.totalPriceSek;
                  if (window.DiamondPricing && diamond.totalPriceSek) {
                    const diamondWithMarkup = await window.DiamondPricing.applyMarkupToDiamond(diamond);
                    if (diamondWithMarkup.finalPriceSek && diamondWithMarkup.finalPriceSek > 0) {
                      finalPriceSek = diamondWithMarkup.finalPriceSek;
                    }
                  }
                  
                  // Apply price filters
                  let passesFilter = true;
                  if (!isNaN(minPrice) && finalPriceSek < minPrice) {
                    passesFilter = false;
                  }
                  if (!isNaN(maxPrice) && finalPriceSek > maxPrice) {
                    passesFilter = false;
                  }
                  
                  return passesFilter ? diamond : null;
                } catch (error) {
                  console.warn('[DIAMOND RENDERER] Error filtering by finalPriceSek:', error);
                  return diamond; // Keep diamond if error occurs
                }
              })
            );
            
            // Remove null entries
            validPriceDiamonds = validPriceDiamonds.filter(diamond => diamond !== null);
            
            console.log(`[PRICE FILTER] Filtered from ${beforePriceFilterCount} to ${validPriceDiamonds.length} diamonds based on finalPriceSek`);
          }
        }
      }

      // Apply image filter based on checkbox state
      if (!state.showNoImage) {
        // Default: Only show diamonds with images
        validPriceDiamonds = validPriceDiamonds.filter((diamond) => {
          // Check for non-empty strings, not just existence, and exclude "null" strings
          const hasImagePath =
            diamond.imagePath &&
            diamond.imagePath.trim() !== '' &&
            diamond.imagePath !== 'null';
          const hasImageUrl =
            diamond.imageUrl &&
            diamond.imageUrl.trim() !== '' &&
            diamond.imageUrl !== 'null';

          return hasImagePath || hasImageUrl;
        });
      }

      // Apply media filter based on checkbox state
      if (!state.showNoMedia) {
        // Default: Only show diamonds with video or 3D viewer
        const beforeFilterCount = validPriceDiamonds.length;
        validPriceDiamonds = validPriceDiamonds.filter((diamond) => {
          // Check for non-empty strings, not just existence, and exclude "null" strings
          const hasVideoUrl =
            diamond.videoUrl &&
            diamond.videoUrl.trim() !== '' &&
            diamond.videoUrl !== 'null';
          const has3DViewerUrl =
            diamond.threeDViewerUrl &&
            diamond.threeDViewerUrl.trim() !== '' &&
            diamond.threeDViewerUrl !== 'null';

          return hasVideoUrl || has3DViewerUrl;
        });
        console.log(
          `[MEDIA FILTER] Filtered from ${beforeFilterCount} to ${validPriceDiamonds.length} diamonds with 3D/video`
        );
      }

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
        let filterNotes = [];
        if (!state.showNoImage) filterNotes.push('med bild');
        if (!state.showNoMedia) filterNotes.push('med 3D/video');
        const filterNote =
          filterNotes.length > 0
            ? ` (endast ${filterNotes.join(' och ')})`
            : '';
        resultsCountEl.textContent = `Visar ${displayedCount} av ${currentlyShown} hämtade${filterNote}`;
      } else if (resultsCountEl) {
        resultsCountEl.textContent = `${displayedCount} diamanter`;
      }
    },
  };
}
