if (typeof window !== 'undefined') {
  window.allDiamonds = []; // Initialize empty, will be populated from API
  const activeFilters = {};
  window.diamondPaginationInfo = {}; // To store pagination details

  function renderDiamonds(diamondsToRender) {
    const resultsContainer = document.getElementById('diamond-results-container');
    const resultsCountEl = document.getElementById('ds-results-count');

    if (!resultsContainer) return;
    resultsContainer.innerHTML = ''; // Clear previous results

    if (resultsCountEl && window.diamondPaginationInfo) {
      // Display current page count and total count from pagination info
      resultsCountEl.textContent = `${diamondsToRender.length} (Page ${window.diamondPaginationInfo.currentPage} of ${window.diamondPaginationInfo.totalPages}, Total ${window.diamondPaginationInfo.totalDiamonds})`;
    } else if (resultsCountEl) {
      resultsCountEl.textContent = diamondsToRender.length; // Fallback if pagination info not ready
    }

    if (diamondsToRender.length === 0) {
      resultsContainer.innerHTML = '<p class="tw-text-center tw-text-gray-500 tw-py-10">No diamonds match your criteria on this page.</p>';
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-4 tw-gap-6';

    diamondsToRender.forEach(diamond => {
      const diamondCard = document.createElement('div');
      diamondCard.className = 'tw-flex tw-flex-col tw-bg-white tw-border tw-rounded-lg tw-p-4 tw-shadow hover:tw-shadow-md tw-transition-shadow tw-overflow-hidden';

      const image = document.createElement('img');
      image.className = 'tw-w-full tw-h-48 tw-object-contain tw-rounded-md tw-mb-4';

      // Safely set image source
      if (diamond.imagePath) {
        image.src = diamond.imagePath;
      } else {
        image.src = 'https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_large.png'; // Default placeholder
        console.warn('Diamond missing imagePath:', diamond.itemId);
      }

      const carats = diamond.carat !== null && typeof diamond.carat === 'number' ? diamond.carat.toFixed(2) : 'N/A';
      const shape = diamond.cut || 'Unknown Shape';
      // const type = diamond.type || 'Diamond'; // Type field is missing in new data, addressing with user. For now, let's use a placeholder or omit.
      const displayType = 'Diamond'; // Placeholder until type is clarified

      image.alt = `${carats}ct ${shape} ${displayType}`;

      const titleText = `${carats}ct ${shape} ${displayType}`;
      const title = document.createElement('h3');
      title.className = 'tw-text-lg tw-font-semibold tw-mb-1 tw-truncate';
      title.textContent = titleText;

      const subtitleParts = [];
      if (diamond.color) subtitleParts.push(`Colour: ${diamond.color}`);
      if (diamond.clarity) subtitleParts.push(`Clarity: ${diamond.clarity}`);
      if (diamond.cutGrade) subtitleParts.push(`Cut: ${diamond.cutGrade}`); // Using cutGrade for "Cut"

      if (subtitleParts.length === 0) {
        subtitleParts.push('Details not specified');
      }

      const subtitle = document.createElement('p');
      subtitle.className = 'tw-text-sm tw-text-gray-600 tw-mb-2';
      subtitle.textContent = subtitleParts.join(', ');

      const priceCertWrapper = document.createElement('div');
      priceCertWrapper.className = 'tw-flex tw-justify-between tw-items-center tw-mb-3';

      const price = document.createElement('p');
      price.className = 'tw-text-lg tw-font-bold text-gray-900';
      const displayPrice = diamond.totalPrice !== null && typeof diamond.totalPrice === 'number' ? diamond.totalPrice.toLocaleString() : 'Price N/A';
      // const displayCurrency = diamond.currency || ''; // Currency field is missing, addressing with user.
      const displayCurrency = 'USD'; // Defaulting to USD as per user confirmation
      price.textContent = `${displayPrice} ${displayCurrency}`.trim();

      const certInfo = document.createElement('p');
      certInfo.className = 'tw-text-sm tw-text-gray-500';
      certInfo.textContent = diamond.gradingLab ? `${diamond.gradingLab} Certified` : 'Certification N/A';

      priceCertWrapper.appendChild(price);
      priceCertWrapper.appendChild(certInfo);

      diamondCard.appendChild(image);
      diamondCard.appendChild(title);
      diamondCard.appendChild(subtitle);
      diamondCard.appendChild(priceCertWrapper);

      const addButton = document.createElement('button');
      addButton.className = 'tw-w-full tw-bg-white tw-text-gray-800 tw-py-2 tw-px-4 tw-rounded tw-border tw-border-gray-300 hover:tw-bg-gray-100 tw-transition-colors tw-text-base tw-mt-auto';
      addButton.textContent = 'Add to cart';
      addButton.onclick = () => console.log('Add to cart:', diamond.itemId); // Use itemId

      diamondCard.appendChild(addButton);
      grid.appendChild(diamondCard);
    });
    resultsContainer.appendChild(grid);
  }

  async function fetchDiamondData(page = 1, limit = 24) { // Default to page 1, limit 24 (common for grids)
    const resultsContainer = document.getElementById('diamond-results-container');
    // Ensure loading message is visible during fetch, and button is present
    if (resultsContainer) {
      // Check if the button is already the first child. If not, add it.
      const refreshButtonHTML = `
        <div class="tw-mb-4 tw-text-right">
          <button
            type="button"
            id="manual-diamond-refresh-button"
            class="tw-bg-blue-500 hover:tw-bg-blue-600 tw-text-white tw-font-semibold tw-py-2 tw-px-4 tw-rounded-md tw-shadow-sm tw-text-sm"
          >
            Refresh Diamond Data (Admin)
          </button>
        </div>`;
      const loadingMessageHTML = '<p class="tw-text-center tw-py-10 tw-text-gray-500">Loading available diamonds...</p>';

      // Add button if not present, then loading message
      if (!document.getElementById('manual-diamond-refresh-button')) {
        resultsContainer.innerHTML = refreshButtonHTML + loadingMessageHTML;
      } else {
        // If button exists, ensure loading message is also there or re-added if cleared by previous render
        const existingLoadingMessage = resultsContainer.querySelector('p.tw-text-center');
        if (!existingLoadingMessage) {
            // Append loading message after the button div
            const buttonDiv = document.getElementById('manual-diamond-refresh-button').parentElement;
            if(buttonDiv) buttonDiv.insertAdjacentHTML('afterend', loadingMessageHTML);
        }
      }
    }

    try {
      // Fetch with pagination parameters
      const response = await fetch(`/apps/api/diamonds/all?page=${page}&limit=${limit}`);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json(); // data is the pagination object

      window.allDiamonds = data.diamonds || []; // Store only the diamonds for the current page, ensure it's an array
      window.diamondPaginationInfo = {
        currentPage: data.currentPage,
        totalPages: data.totalPages,
        totalDiamonds: data.totalDiamonds,
        limit: data.limit,
        totalNaturalDiamonds: data.totalNaturalDiamonds, // Store these too
        totalLabDiamonds: data.totalLabDiamonds,
      };

      if (resultsContainer) {
        // Clear only the loading message, keep the button if it was added
        const loadingMessage = resultsContainer.querySelector('p.tw-text-center.tw-py-10.tw-text-gray-500');
        if (loadingMessage) loadingMessage.remove();
      }

      renderDiamonds(window.allDiamonds);
      setupFilterButtonGroups();
      applyAllFilters();

    } catch (error) {
      console.error('Failed to fetch diamond data:', error);
      if (resultsContainer) {
        const buttonDiv = document.getElementById('manual-diamond-refresh-button')?.parentElement;
        const errorHTML = '<p class="tw-text-center tw-text-red-500 tw-py-10">Failed to load diamonds. Please try again later.</p>';
        if (buttonDiv) {
            resultsContainer.innerHTML = buttonDiv.outerHTML + errorHTML;
        } else {
            resultsContainer.innerHTML = errorHTML;
        }
      }
    }
  }

  function applyAllFilters() {
    let filteredDiamonds = [...window.allDiamonds];

    // Type filter (single select) - Needs clarification on how to get 'type' from new data
    if (activeFilters['ds-type']) {
      // If diamond.type is undefined, this filter will not exclude it.
      // This allows other filters to still work.
      // The filter will only apply if d.type is present in the data.
      filteredDiamonds = filteredDiamonds.filter(d => d.type === undefined || d.type === activeFilters['ds-type']);
    }

    // Shape filter (multi-select)
    if (activeFilters['ds-shape'] && activeFilters['ds-shape'].length > 0) {
      filteredDiamonds = filteredDiamonds.filter(d => {
        const diamondShape = d.cut ? d.cut.toUpperCase() : ''; // Ensure comparison is case-insensitive
        return activeFilters['ds-shape'].includes(diamondShape);
      });
    }

    // Min Carat
    const minCaratInput = document.getElementById('ds-min-carat');
    if (minCaratInput) {
      const minCarat = parseFloat(minCaratInput.value);
      if (!isNaN(minCarat)) {
          filteredDiamonds = filteredDiamonds.filter(d => d.carat !== null && d.carat >= minCarat);
      }
    }

    // Max Carat
    const maxCaratInput = document.getElementById('ds-max-carat');
    if (maxCaratInput) {
      const maxCarat = parseFloat(maxCaratInput.value);
      if (!isNaN(maxCarat)) {
          filteredDiamonds = filteredDiamonds.filter(d => d.carat !== null && d.carat <= maxCarat);
      }
    }

    // Min Price Filter (New - using ds-min-price input)
    const minPriceInput = document.getElementById('ds-min-price');
    if (minPriceInput) {
        const minPrice = parseFloat(minPriceInput.value.replace(/[^\d.-]/g, '')); // Remove non-numeric for parsing
        if (!isNaN(minPrice)) {
            filteredDiamonds = filteredDiamonds.filter(d => d.totalPrice !== null && d.totalPrice >= minPrice);
        }
    }

    // Max Price Filter (New - using ds-max-price input)
    const maxPriceInput = document.getElementById('ds-max-price');
    if (maxPriceInput) {
        const maxPrice = parseFloat(maxPriceInput.value.replace(/[^\d.-]/g, '')); // Remove non-numeric for parsing
        if (!isNaN(maxPrice)) {
            filteredDiamonds = filteredDiamonds.filter(d => d.totalPrice !== null && d.totalPrice <= maxPrice);
        }
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
        /* START REMOVAL
        if (groupId === 'ds-type') {
            const naturalButton = group.querySelector('[data-value="Natural"]');
            if (naturalButton) {
                naturalButton.classList.add('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
                naturalButton.setAttribute('aria-pressed', 'true');
                naturalButton.dataset.active = 'true';
                activeFilters[groupId] = 'Natural';
            }
        }
        END REMOVAL */
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
              button.classList.remove('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
              button.setAttribute('aria-pressed', 'false');
              button.dataset.active = 'false';
            } else {
              activeFilters[groupId].push(value);
              button.classList.add('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
              button.setAttribute('aria-pressed', 'true');
              button.dataset.active = 'true';
            }
          } else {
            // Single select behavior
            if (activeFilters[groupId] === value) {
              // Optional: allow deselecting single-select if clicked again
              // activeFilters[groupId] = null;
              // button.classList.remove('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
              // button.setAttribute('aria-pressed', 'false');
              // button.dataset.active = 'false';
            } else {
              buttons.forEach(b => { // Deselect other buttons in the group
                b.classList.remove('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
                b.setAttribute('aria-pressed', 'false');
                b.dataset.active = 'false';
              });
              activeFilters[groupId] = value;
              button.classList.add('tw-bg-gray-600', 'tw-text-white', 'tw-border-gray-600');
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
    fetchDiamondData(); // Fetch data instead of using window.diamondData

    const applyFiltersButton = document.getElementById('ds-apply-filters');
    if (applyFiltersButton) {
      applyFiltersButton.addEventListener('click', applyAllFilters);
    }

    // Add event listeners for carat inputs to filter on change
    const minCaratInput = document.getElementById('ds-min-carat');
    const maxCaratInput = document.getElementById('ds-max-carat');
    if(minCaratInput) minCaratInput.addEventListener('input', applyAllFilters);
    if(maxCaratInput) maxCaratInput.addEventListener('input', applyAllFilters);

    // Add event listeners for price inputs to filter on change
    const minPriceInput = document.getElementById('ds-min-price');
    const maxPriceInput = document.getElementById('ds-max-price');
    if(minPriceInput) minPriceInput.addEventListener('input', applyAllFilters);
    if(maxPriceInput) maxPriceInput.addEventListener('input', applyAllFilters);

    // Handle color slider image visibility
    const colorSlider = document.getElementById('ds-colour-slider');
    const colorImagesDiv = document.getElementById('ds-colour-images');

    if (colorSlider && colorImagesDiv) {
      const showImages = () => {
        colorImagesDiv.style.opacity = '1';
        colorImagesDiv.style.pointerEvents = 'auto';
      };

      const hideImages = () => {
        colorImagesDiv.style.opacity = '0';
        colorImagesDiv.style.pointerEvents = 'none';
      };

      colorSlider.addEventListener('mousedown', showImages);
      colorSlider.addEventListener('touchstart', showImages); // For touch devices

      // Hide when mouse is released anywhere or focus is lost
      document.addEventListener('mouseup', hideImages);
      colorSlider.addEventListener('blur', hideImages); // Hide when slider loses focus
      document.addEventListener('touchend', hideImages); // For touch devices, hide on touchend
    }

    const refreshButton = document.getElementById('manual-diamond-refresh-button');

    if (refreshButton) {
      refreshButton.addEventListener('click', async () => {
        const originalButtonText = refreshButton.textContent;
        refreshButton.textContent = 'Refreshing...';
        refreshButton.disabled = true;

        try {
          // The route for the refresh action is /admin/trigger-refresh
          // Shopify app proxy might prefix this, or you might need to adjust
          // if your extension serves assets/routes differently.
          // For a theme app extension, direct fetch to this path should work if
          // the Remix app is serving at the root or a known proxy path.
          // We assume the Remix app is at the domain root for this path.
          const response = await fetch('/admin/trigger-refresh', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json', // Though the action doesn't strictly need a body
            },
          });

          const result = await response.json();

          if (response.ok && result.success) {
            alert('Diamond data refresh triggered successfully! New data will be fetched.');
            console.log('Refresh success:', result);
            // Re-fetch data after successful refresh
            fetchDiamondData();
          } else {
            throw new Error(result.message || `Failed to trigger refresh. Status: ${response.status}`);
          }
        } catch (error) {
          console.error('Error triggering diamond refresh:', error);
          alert(`Error triggering refresh: ${error.message}`);
        } finally {
          refreshButton.textContent = originalButtonText;
          refreshButton.disabled = false;
        }
      });
    }

  });
}