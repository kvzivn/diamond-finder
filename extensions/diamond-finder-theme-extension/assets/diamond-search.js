if (typeof window !== 'undefined') {
  window.allDiamonds = []; // Initialize empty, will be populated from diamondData
  const activeFilters = {};

  function renderDiamonds(diamondsToRender) {
    const resultsContainer = document.getElementById('diamond-results-container');
    const resultsCountEl = document.getElementById('ds-results-count');

    if (!resultsContainer) return;
    resultsContainer.innerHTML = ''; // Clear previous results

    if (resultsCountEl) {
      resultsCountEl.textContent = diamondsToRender.length;
    }

    if (diamondsToRender.length === 0) {
      resultsContainer.innerHTML = '<p class="tw-text-center tw-text-gray-500 tw-py-10">No diamonds match your criteria.</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6';

    diamondsToRender.forEach(diamond => {
      const diamondCard = document.createElement('div');
      diamondCard.className = 'tw-flex tw-flex-col tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-shadow hover:tw-shadow-md tw-transition-shadow tw-overflow-hidden';

      const image = document.createElement('img');
      image.className = 'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';
      image.src = diamond.image && diamond.image.src ? diamond.image.src : (diamond.topImage || 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png');
      image.alt = `${diamond.certificate.carats.toFixed(2)}ct ${diamond.certificate.shape} ${diamond.type} Diamond`;

      const titleText = `${diamond.certificate.carats.toFixed(2)}ct ${diamond.certificate.shape} ${diamond.type} Diamond`;
      const title = document.createElement('h3');
      title.className = 'tw-text-lg tw-font-semibold tw-mb-1 tw-truncate';
      title.textContent = titleText;

      const subtitleParts = [];
      if (diamond.certificate.color) subtitleParts.push(`Colour: ${diamond.certificate.color}`);
      if (diamond.certificate.clarity) subtitleParts.push(`Clarity: ${diamond.certificate.clarity}`);
      if (diamond.certificate.cut) subtitleParts.push(`Cut: ${diamond.certificate.cut}`);

      const subtitle = document.createElement('p');
      subtitle.className = 'tw-text-sm tw-text-gray-600 tw-mb-2';
      subtitle.textContent = subtitleParts.join(', ');

      const priceCertWrapper = document.createElement('div');
      priceCertWrapper.className = 'tw-flex tw-justify-between tw-items-center tw-mb-3';

      const price = document.createElement('p');
      price.className = 'tw-text-lg tw-font-bold text-gray-900';
      price.textContent = `${diamond.price.toLocaleString()} ${diamond.currency}`;

      const certInfo = document.createElement('p');
      certInfo.className = 'tw-text-sm tw-text-gray-500';
      certInfo.textContent = `${diamond.certificate.lab} Certified`;

      priceCertWrapper.appendChild(price);
      priceCertWrapper.appendChild(certInfo);

      diamondCard.appendChild(image);
      diamondCard.appendChild(title);
      diamondCard.appendChild(subtitle);
      diamondCard.appendChild(priceCertWrapper);

      const addButton = document.createElement('button');
      addButton.className = 'tw-w-full tw-bg-white tw-text-gray-800 tw-py-2 tw-px-4 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition-colors tw-text-base tw-mt-auto';
      addButton.textContent = 'Add to cart';
      addButton.onclick = () => console.log('Add to cart:', diamond.id);

      diamondCard.appendChild(addButton);
      grid.appendChild(diamondCard);
    });
    resultsContainer.appendChild(grid);
  }

  function applyAllFilters() {
    let filteredDiamonds = [...window.allDiamonds];

    // Type filter (single select)
    if (activeFilters['ds-type']) {
      filteredDiamonds = filteredDiamonds.filter(d => d.type === activeFilters['ds-type']);
    }

    // Shape filter (multi-select)
    if (activeFilters['ds-shape'] && activeFilters['ds-shape'].length > 0) {
      filteredDiamonds = filteredDiamonds.filter(d => activeFilters['ds-shape'].includes(d.certificate.shape));
    }

    // Min Carat
    const minCarat = parseFloat(document.getElementById('ds-min-carat').value);
    if (!isNaN(minCarat)) {
        filteredDiamonds = filteredDiamonds.filter(d => d.certificate.carats >= minCarat);
    }

    // Max Carat
    const maxCarat = parseFloat(document.getElementById('ds-max-carat').value);
    if (!isNaN(maxCarat)) {
        filteredDiamonds = filteredDiamonds.filter(d => d.certificate.carats <= maxCarat);
    }

    renderDiamonds(filteredDiamonds);
  }

  function setupFilterButtonGroups() {
    const filterGroups = document.querySelectorAll('[data-filter-group]');
    filterGroups.forEach(group => {
      const groupId = group.dataset.filterGroup;
      const isMultiSelect = group.dataset.multiselect === 'true';
      const buttons = group.querySelectorAll('.filter-button');

      if (!isMultiSelect) {
        activeFilters[groupId] = null; // For single-select, initialize or set to default
        // Optional: Set a default active button for single-select groups if needed
        // For example, to make "Natural" active by default:
        if (groupId === 'ds-type') {
            const naturalButton = group.querySelector('[data-value="Natural"]');
            if (naturalButton) {
                naturalButton.classList.add('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
                naturalButton.setAttribute('aria-pressed', 'true');
                naturalButton.dataset.active = 'true';
                activeFilters[groupId] = 'Natural';
            }
        }
      } else {
        activeFilters[groupId] = []; // For multi-select
      }

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value;
          if (isMultiSelect) {
            const index = activeFilters[groupId].indexOf(value);
            if (index > -1) {
              activeFilters[groupId].splice(index, 1);
              button.classList.remove('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
              button.setAttribute('aria-pressed', 'false');
              button.dataset.active = 'false';
            } else {
              activeFilters[groupId].push(value);
              button.classList.add('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
              button.setAttribute('aria-pressed', 'true');
              button.dataset.active = 'true';
            }
          } else {
            // Single select behavior
            if (activeFilters[groupId] === value) {
              // Optional: allow deselecting single-select if clicked again
              // activeFilters[groupId] = null;
              // button.classList.remove('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
              // button.setAttribute('aria-pressed', 'false');
              // button.dataset.active = 'false';
            } else {
              buttons.forEach(b => { // Deselect other buttons in the group
                b.classList.remove('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
                b.setAttribute('aria-pressed', 'false');
                b.dataset.active = 'false';
              });
              activeFilters[groupId] = value;
              button.classList.add('tw-bg-indigo-600', 'tw-text-white', 'tw-border-indigo-600');
              button.setAttribute('aria-pressed', 'true');
              button.dataset.active = 'true';
            }
          }
          // console.log('Active filters:', activeFilters);
          // For immediate filtering on button click (optional):
          // applyAllFilters();
        });
      });
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (window.diamondData) {
      window.allDiamonds = window.diamondData;
      setupFilterButtonGroups();
      // Set default type filter to 'Natural' and apply initial filters
      // This ensures the default view is filtered by Natural if that button is pre-selected.
      applyAllFilters(); // Apply filters on initial load
    } else {
      console.error('Diamond data not loaded yet.');
      // Fallback might be needed if script loading order is an issue
      setTimeout(() => {
          if (window.diamondData) {
              window.allDiamonds = window.diamondData;
              setupFilterButtonGroups();
              applyAllFilters();
          }
      }, 200)
    }

    const applyFiltersButton = document.getElementById('ds-apply-filters');
    if (applyFiltersButton) {
      applyFiltersButton.addEventListener('click', applyAllFilters);
    }

    // Add event listeners for carat inputs to filter on change
    const minCaratInput = document.getElementById('ds-min-carat');
    const maxCaratInput = document.getElementById('ds-max-carat');
    if(minCaratInput) minCaratInput.addEventListener('input', applyAllFilters);
    if(maxCaratInput) maxCaratInput.addEventListener('input', applyAllFilters);
  });
}