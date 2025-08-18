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
    async showDiamondDetails(diamond) {
      const searchView = document.getElementById('diamond-search-view');
      const detailsView = document.getElementById('diamond-details-view');

      if (!searchView || !detailsView) return;

      // Debug logging for 3D/video URLs
      console.log('[DIAMOND DETAILS] Selected diamond:', {
        itemId: diamond.itemId,
        videoUrl: diamond.videoUrl,
        threeDViewerUrl: diamond.threeDViewerUrl,
        imagePath: diamond.imagePath,
        hasVideo: !!(
          diamond.videoUrl &&
          diamond.videoUrl.trim() !== '' &&
          diamond.videoUrl !== 'null'
        ),
        has3DViewer: !!(
          diamond.threeDViewerUrl &&
          diamond.threeDViewerUrl.trim() !== '' &&
          diamond.threeDViewerUrl !== 'null'
        ),
      });

      // Set current diamond in state
      if (window.DiamondState && window.DiamondState.setCurrentDiamond) {
        window.DiamondState.setCurrentDiamond(diamond);
      }

      // Hide search view and show details view
      searchView.classList.add('tw-hidden');
      detailsView.classList.remove('tw-hidden');

      // Populate diamond details
      await this.populateDiamondDetails(diamond);

      // Setup media tabs
      this.setup3DViewerContent(diamond);
      this.setupCertificateContent(diamond);
      this.setupImagePreview(diamond);

      // Initialize carat sizer
      if (window.DiamondCaratSizer) {
        window.DiamondCaratSizer.initialize(diamond);
      }

      // Default to image tab regardless of 3D availability
      this.switchTab('image');

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
    async populateDiamondDetails(diamond) {
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
            'tw-w-full tw-h-full tw-object-contain tw-bg-white';
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
                'tw-w-full tw-h-full tw-object-contain';
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
          placeholderImg.className = 'tw-w-full tw-h-full tw-object-contain';
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

      // Update price - apply client-side markup and show both prices
      const price = document.getElementById('diamond-details-price');
      if (price) {
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
              '[DIAMOND DETAILS] Error applying markup, using base price:',
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

        // Create price display with both original and final prices
        if (markupApplied && originalPrice !== finalPrice) {
          price.innerHTML = `
            <div class="tw-flex tw-flex-col">
              <p class="tw-text-sm tw-text-gray-500">Ursprungspris: ${originalPrice} ${displayCurrency}</p>
              <p class="tw-text-xl tw-font-bold tw-text-gray-900">${finalPrice} ${displayCurrency} <span class="tw-text-sm tw-text-green-600">(markup)</span></p>
            </div>
          `;
        } else {
          price.textContent = `${finalPrice} ${displayCurrency}`;
        }
      }

      // Update specifications
      const specsContainer = document.getElementById('diamond-details-specs');
      if (specsContainer) {
        specsContainer.innerHTML = '';

        const specs = [
          {
            label: 'URSPRUNG:',
            value: diamond.type === 'lab' ? 'Labbodlad' : 'Naturlig',
          },
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
            label: 'CERTIFIKATNUMMER:',
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

          // Check if this is the certificate number and we have a certificate URL
          if (spec.label === 'CERTIFIKATNUMMER:' && spec.value !== 'Ej tillgänglig') {
            const certificateLink = diamond.certificateUrl || diamond.certificatePath;
            if (certificateLink) {
              // Create a link for the certificate number
              const value = document.createElement('a');
              value.className = 'tw-text-gray-800 tw-text-sm tw-underline hover:tw-text-gray-600';
              value.textContent = spec.value;
              value.href = certificateLink;
              value.target = '_blank';
              value.rel = 'noopener noreferrer';
              specRow.appendChild(label);
              specRow.appendChild(value);
            } else {
              // No certificate link, render as normal text
              const value = document.createElement('span');
              value.className = 'tw-text-gray-800 tw-text-sm';
              value.textContent = spec.value;
              specRow.appendChild(label);
              specRow.appendChild(value);
            }
          } else {
            // Regular spec item
            const value = document.createElement('span');
            value.className = 'tw-text-gray-800 tw-text-sm';
            value.textContent = spec.value;
            specRow.appendChild(label);
            specRow.appendChild(value);
          }

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

      // Initialize tab functionality
      this.initializeTabs();
    },

    // Initialize tab switching functionality
    initializeTabs() {
      const tabs = ['3d-video', 'image', 'certificate', 'carat-sizer'];

      tabs.forEach((tabName) => {
        const tabButton = document.getElementById(`tab-${tabName}`);
        if (tabButton) {
          if (tabName === 'certificate') {
            // Certificate tab should open certificate link directly
            tabButton.addEventListener('click', () => {
              const currentDiamond = window.DiamondState?.getCurrentDiamond?.();
              if (currentDiamond) {
                const certificateLink =
                  currentDiamond.certificateUrl ||
                  currentDiamond.certificatePath;
                if (certificateLink) {
                  window.open(certificateLink, '_blank');
                  return;
                }
              }
              // Fallback to normal tab switching if no certificate link
              this.switchTab(tabName);
            });
          } else {
            tabButton.addEventListener('click', () => this.switchTab(tabName));
          }
        }
      });
    },

    // Switch between tabs
    switchTab(activeTab) {
      const tabs = ['3d-video', 'image', 'certificate', 'carat-sizer'];

      tabs.forEach((tabName) => {
        const tabButton = document.getElementById(`tab-${tabName}`);
        const tabContent = document.getElementById(`content-${tabName}`);

        if (tabButton && tabContent) {
          if (tabName === activeTab) {
            // Activate tab
            tabButton.classList.add('tw-border-gray-600');
            tabContent.classList.remove('tw-hidden');
          } else {
            // Deactivate tab
            tabButton.classList.remove('tw-border-gray-600');
            tabContent.classList.add('tw-hidden');
          }
        }
      });
    },

    // Check if URL contains allowed 3D viewer domains
    isAllowed3DViewerUrl(url) {
      if (!url) return false;
      const allowedDomains = [
        'nivoda-inhousemedia',
        'cloudstorage20',
        'gem360',
        'vv360.in',
        'v360.in',
        'd3at7kzws0mw3g.cloudfront.net',
        'antwerpdiamondview.com',
        'diamdna.azureedge.net',
        'mydiamonds.info',
        '.mp4',
        'Vision360.html',
        'vision360.html',
      ];
      return allowedDomains.some((domain) => url.includes(domain));
    },

    // Setup 3D viewer or video content
    setup3DViewerContent(diamond) {
      const container = document.getElementById('diamond-3d-viewer');
      const tab3DButton = document.getElementById('tab-3d-video');

      if (!container || !tab3DButton) return;

      console.log('[3D VIEWER SETUP] Checking media URLs:', {
        threeDViewerUrl: diamond.threeDViewerUrl,
        videoUrl: diamond.videoUrl,
        is3DAllowed: diamond.threeDViewerUrl
          ? this.isAllowed3DViewerUrl(diamond.threeDViewerUrl)
          : false,
        hasMP4Video: diamond.videoUrl
          ? diamond.videoUrl.includes('.mp4')
          : false,
      });

      // Check for 3D viewer URL first
      if (
        diamond.threeDViewerUrl &&
        this.isAllowed3DViewerUrl(diamond.threeDViewerUrl)
      ) {
        // Create iframe for 3D viewer
        const iframe = document.createElement('iframe');
        iframe.src = diamond.threeDViewerUrl;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.scrolling = 'no';
        iframe.className = 'tw-w-full tw-h-full tw-rounded-lg';

        container.innerHTML = '';
        container.appendChild(iframe);

        // Show the tab
        tab3DButton.classList.remove('tw-hidden');
        return true;
      }

      // Check for video URL
      if (diamond.videoUrl && this.isAllowed3DViewerUrl(diamond.videoUrl)) {
        // Check if it's an MP4 video
        if (diamond.videoUrl.includes('.mp4')) {
          // Create video element for MP4
          const video = document.createElement('video');
          video.src = diamond.videoUrl;
          video.controls = true;
          video.autoplay = false;
          video.className =
            'tw-w-full tw-h-full tw-object-contain tw-rounded-lg';

          container.innerHTML = '';
          container.appendChild(video);
        } else {
          // Create iframe for other video formats (Vision360, etc.)
          const iframe = document.createElement('iframe');
          iframe.src = diamond.videoUrl;
          iframe.width = '100%';
          iframe.height = '100%';
          iframe.frameBorder = '0';
          iframe.scrolling = 'no';
          iframe.className = 'tw-w-full tw-h-full tw-rounded-lg';

          container.innerHTML = '';
          container.appendChild(iframe);
        }

        // Show the tab
        tab3DButton.classList.remove('tw-hidden');
        return true;
      }

      // Hide tab if no valid media
      tab3DButton.classList.add('tw-hidden');
      return false;
    },

    // Setup certificate content
    setupCertificateContent(diamond) {
      const container = document.getElementById('diamond-certificate');
      const tabCertButton = document.getElementById('tab-certificate');

      if (!container || !tabCertButton) return;

      // Check if diamond has certificate information
      const certificateLink = diamond.certificateUrl || diamond.certificatePath;
      if (certificateLink && diamond.gradingLab) {
        const lab = diamond.gradingLab.toUpperCase();
        let certificateImage = '';

        // Map lab to certificate image
        if (lab.includes('GIA')) {
          certificateImage = 'GIA.jpg';
        } else if (lab.includes('IGI')) {
          certificateImage = 'IGI.jpg';
        } else if (lab.includes('HRD')) {
          certificateImage = 'HRD.jpg';
        }

        if (certificateImage) {
          // Get the correct certificate image URL from pre-loaded assets
          const certificateImageUrl =
            window.CERTIFICATE_IMAGES &&
            window.CERTIFICATE_IMAGES[lab.toUpperCase()];

          if (certificateImageUrl) {
            // Create certificate display elements - now just shows the preview since clicking opens link
            const certificateContainer = document.createElement('div');
            certificateContainer.className =
              'tw-flex tw-flex-col tw-items-center tw-space-y-4';

            // Create certificate image element
            const certImg = document.createElement('img');
            certImg.alt = `${lab} Certificate`;
            certImg.className = 'tw-w-32 tw-h-auto';
            certImg.src = certificateImageUrl;

            // Create text content
            const textContainer = document.createElement('div');
            textContainer.className = 'tw-text-center';
            textContainer.innerHTML = `
              <p class="tw-text-lg tw-font-medium tw-text-gray-800">${lab} Certifikat</p>
              <p class="tw-text-sm tw-text-gray-600 tw-mb-4">Nr: ${diamond.certificateNumber || 'N/A'}</p>
              <p class="tw-text-sm tw-text-gray-500">Klicka på certifikat-fliken för att öppna</p>
            `;

            certificateContainer.appendChild(certImg);
            certificateContainer.appendChild(textContainer);

            container.innerHTML = '';
            container.appendChild(certificateContainer);

            // Add certificate preview to tab
            const tabPreview = document.getElementById(
              'tab-certificate-preview'
            );
            if (tabPreview) {
              const previewImg = document.createElement('img');
              previewImg.src = certificateImageUrl;
              previewImg.alt = lab;
              previewImg.className =
                'tw-w-full tw-h-full tw-object-contain tw-rounded-sm';

              tabPreview.innerHTML = '';
              tabPreview.appendChild(previewImg);
            }
          }

          // Show the tab
          tabCertButton.classList.remove('tw-hidden');
          return true;
        }
      }

      // Hide tab if no certificate
      tabCertButton.classList.add('tw-hidden');
      return false;
    },

    // Setup image preview in tab
    setupImagePreview(diamond) {
      const tabPreview = document.getElementById('tab-image-preview');
      if (!tabPreview) return;

      if (diamond.imagePath) {
        // Use actual diamond image for preview
        const previewImg = document.createElement('img');
        previewImg.src = diamond.imagePath;
        previewImg.alt = 'Diamond';
        previewImg.className =
          'tw-w-full tw-h-full tw-object-cover tw-rounded-sm';

        // Handle broken images by falling back to SVG icon
        previewImg.onerror = () => {
          if (window.DiamondShapeIcons) {
            const svgElement = window.DiamondShapeIcons.createSvgElement(
              diamond.cut,
              'tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-opacity-60'
            );
            tabPreview.innerHTML = '';
            tabPreview.appendChild(svgElement);
          } else {
            // Fallback to diamond icon
            tabPreview.innerHTML = `
              <svg class="tw-w-6 tw-h-6 tw-text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 6l2-2h10l2 2-7 10L3 6z"/>
              </svg>
            `;
          }
        };

        tabPreview.innerHTML = '';
        tabPreview.appendChild(previewImg);
      } else if (window.DiamondShapeIcons) {
        // Use SVG icon for diamond shape when no image path
        const svgElement = window.DiamondShapeIcons.createSvgElement(
          diamond.cut,
          'tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-opacity-60'
        );
        tabPreview.innerHTML = '';
        tabPreview.appendChild(svgElement);
      } else {
        // Fallback to simple diamond icon
        tabPreview.innerHTML = `
          <svg class="tw-w-6 tw-h-6 tw-text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 6l2-2h10l2 2-7 10L3 6z"/>
          </svg>
        `;
      }
    },
  };
}
