// Diamond Renderer Module
if (typeof window !== 'undefined') {

  window.DiamondRenderer = {

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

    // Create individual diamond card element
    createDiamondCard(diamond) {
      const diamondCard = document.createElement('div');
      diamondCard.className = 'tw-flex tw-flex-col tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-transition-shadow tw-overflow-hidden';

      // Image
      const image = document.createElement('img');
      image.className = 'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
      image.src = diamond.imagePath || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png';

      const carats = diamond.carat !== null && typeof diamond.carat === 'number' ? diamond.carat.toFixed(2) : 'N/A';
      const shape = diamond.cut || 'Unknown Shape';
      const displayType = 'Diamond';
      image.alt = `${carats}ct ${shape} ${displayType}`;

      // Title
      const title = document.createElement('h3');
      title.className = 'tw-text-lg tw-font-semibold tw-mb-1 tw-truncate';
      title.textContent = `${carats}ct ${shape} ${displayType}`;

            // Subtitle with diamond details
      const subtitle = document.createElement('div');
      subtitle.className = 'tw-text-sm tw-text-gray-600 tw-mb-2 tw-flex tw-flex-col tw-gap-1';

      const detailsData = [];
      if (diamond.color) detailsData.push({ label: 'Colour:', value: diamond.color });
      if (diamond.clarity) detailsData.push({ label: 'Clarity:', value: diamond.clarity });
      if (diamond.cutGrade) detailsData.push({ label: 'Cut:', value: diamond.cutGrade });

      if (detailsData.length > 0) {
        detailsData.forEach(detail => {
          const detailRow = document.createElement('div');
          detailRow.className = 'tw-flex';

          const label = document.createElement('span');
          label.className = 'tw-w-1/2';
          label.textContent = detail.label;

          const value = document.createElement('span');
          value.className = 'tw-w-1/2 tw-text-right';
          value.textContent = detail.value;

          detailRow.appendChild(label);
          detailRow.appendChild(value);
          subtitle.appendChild(detailRow);
        });
      } else {
        const detailRow = document.createElement('div');
        detailRow.className = 'tw-text-center';
        detailRow.textContent = 'Details not specified';
        subtitle.appendChild(detailRow);
      }

      // Price and certification wrapper
      const priceCertWrapper = document.createElement('div');
      priceCertWrapper.className = 'tw-flex tw-justify-between tw-items-center tw-mb-3';

      // Price
      const price = document.createElement('p');
      price.className = 'tw-text-lg tw-font-bold text-gray-900';

      let displayPrice = 'Price N/A';
      let displayCurrency = 'SEK';

      if (diamond.totalPriceSek !== null && typeof diamond.totalPriceSek === 'number') {
        const roundedPrice = Math.round(diamond.totalPriceSek / 100) * 100;
        displayPrice = roundedPrice.toLocaleString('sv-SE').replace(/,/g, ' ');
      } else if (diamond.totalPrice !== null && typeof diamond.totalPrice === 'number') {
        displayPrice = diamond.totalPrice.toLocaleString();
        displayCurrency = 'USD';
      }

      price.textContent = `${displayPrice} ${displayCurrency}`.trim();

      // Certification info
      const certInfo = document.createElement('p');
      certInfo.className = 'tw-text-sm tw-text-gray-500';
      certInfo.textContent = diamond.gradingLab ? `${diamond.gradingLab} Certified` : 'Certification N/A';

      priceCertWrapper.appendChild(price);
      priceCertWrapper.appendChild(certInfo);

      // Add to cart button
      const addButton = document.createElement('button');
      addButton.className = 'tw-w-full tw-bg-white tw-text-gray-800 tw-py-2 tw-px-4 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition-colors tw-text-base tw-mt-auto';
      addButton.textContent = 'Add to cart';
      addButton.onclick = () => {}; // Placeholder for cart functionality

      // Assemble card
      diamondCard.appendChild(image);
      diamondCard.appendChild(title);
      diamondCard.appendChild(subtitle);
      diamondCard.appendChild(priceCertWrapper);
      diamondCard.appendChild(addButton);

      return diamondCard;
    },

    // Main render function
    renderDiamonds(diamondsToRender) {
      const state = window.DiamondSearchState;
      const gridArea = document.getElementById('diamond-grid-area');
      const resultsCountEl = document.getElementById('ds-results-count');

      if (!gridArea) return;

      // Remove loading animation
      gridArea.classList.remove('tw-opacity-60');
      gridArea.innerHTML = '';

      // Sort diamonds
      const sortedDiamonds = this.sortDiamonds(diamondsToRender, state.currentSort);

      if (!sortedDiamonds || sortedDiamonds.length === 0) {
        gridArea.innerHTML = '<p class="tw-text-center tw-text-gray-500 tw-py-10">No diamonds match your criteria.</p>';
      } else {
        const grid = document.createElement('div');
        grid.className = 'tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6';
        gridArea.appendChild(grid);

        sortedDiamonds.forEach(diamond => {
          const diamondCard = this.createDiamondCard(diamond);
          grid.appendChild(diamondCard);
        });
      }

      // Update results count
      this.updateResultsCount(resultsCountEl, sortedDiamonds.length);
    },

    // Update results count display
    updateResultsCount(resultsCountEl, displayedCount) {
      const state = window.DiamondSearchState;

      if (resultsCountEl && state.paginationInfo && state.paginationInfo.totalDiamonds !== undefined) {
        const currentlyShown = state.allDiamonds.length;
        const totalFiltered = state.paginationInfo.totalDiamonds;
        resultsCountEl.textContent = `Visar ${currentlyShown} av ${totalFiltered.toLocaleString()} diamanter`;
      } else if (resultsCountEl) {
        resultsCountEl.textContent = `${displayedCount} diamanter`;
      }
    }
  };
}