// Diamond Details Module
if (typeof window !== 'undefined') {

  window.DiamondDetails = {

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
      // Update image
      const image = document.getElementById('diamond-details-image');
      if (image) {
        image.src = diamond.imagePath || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png";
        image.alt = `${diamond.carat}ct ${diamond.cut} Diamond`;
      }

      // Update title
      const title = document.getElementById('diamond-details-title');
      if (title) {
        title.textContent = `DIAMOND ${(diamond.cut || 'UNKNOWN').toUpperCase()}`;
      }

      // Update price
      const price = document.getElementById('diamond-details-price');
      if (price) {
        let displayPrice = 'Price N/A';
        if (diamond.totalPriceSek !== null && typeof diamond.totalPriceSek === 'number') {
          const roundedPrice = Math.round(diamond.totalPriceSek / 100) * 100;
          displayPrice = `${roundedPrice.toLocaleString('sv-SE').replace(/,/g, ' ')} SEK`;
        } else if (diamond.totalPrice !== null && typeof diamond.totalPrice === 'number') {
          displayPrice = `${diamond.totalPrice.toLocaleString()} USD`;
        }
        price.textContent = displayPrice;
      }

      // Update specifications
      const specsContainer = document.getElementById('diamond-details-specs');
      if (specsContainer) {
        specsContainer.innerHTML = '';

        const specs = [
          { label: 'CUT:', value: diamond.cut || 'N/A' },
          { label: 'CARAT:', value: diamond.carat || 'N/A' },
          { label: 'COLOR:', value: diamond.color || 'N/A' },
          { label: 'CLARITY:', value: diamond.clarity || 'N/A' },
          { label: 'CUT GRADE:', value: diamond.cutGrade || 'None' },
          { label: 'SYMMETRY:', value: diamond.symmetry || 'N/A' },
          { label: 'POLISH:', value: diamond.polish || 'N/A' },
          { label: 'CERTIFICATE NUMBER:', value: diamond.certificateNumber || 'N/A' },
          { 
            label: 'MEASUREMENTS:', 
            value: (diamond.measurementsLength && diamond.measurementsWidth && diamond.measurementsHeight)
              ? `${diamond.measurementsLength} × ${diamond.measurementsWidth} × ${diamond.measurementsHeight}`
              : 'N/A'
          },
          { label: 'TABLE WIDTH %:', value: diamond.tablePercent || 'N/A' },
          { label: 'TOTAL DEPTH %:', value: diamond.depthPercent || 'N/A' },
          { 
            label: 'GIRDLE:', 
            value: (diamond.girdleFrom && diamond.girdleTo)
              ? `${diamond.girdleFrom} - ${diamond.girdleTo}`
              : 'N/A'
          },
          { label: 'FLUORESCENCE:', value: diamond.fluorescenceIntensity || 'None' }
        ];

        specs.forEach(spec => {
          const specRow = document.createElement('div');
          specRow.className = 'tw-flex tw-justify-between tw-border-b tw-border-gray-200 tw-pb-2';
          
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
    }
  };
}