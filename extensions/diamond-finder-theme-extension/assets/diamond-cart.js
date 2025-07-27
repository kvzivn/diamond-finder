// Diamond Cart Module
if (typeof window !== 'undefined') {
  window.DiamondCart = {
    // State management for cart operations
    state: {
      isAddingToCart: false,
      lastAddedVariantId: null,
    },

    // Create a variant for the diamond and add it to cart
    async addDiamondToCart(diamond) {
      if (this.state.isAddingToCart) {
        console.log('[DIAMOND CART] Already adding to cart, please wait...');
        return { success: false, error: 'Already processing, please wait' };
      }

      this.state.isAddingToCart = true;
      this.updateAddToCartButton(true);

      try {
        // Apply markup to diamond if pricing module is available
        let diamondWithPricing = diamond;
        if (
          window.DiamondPricing &&
          window.DiamondPricing.applyMarkupToDiamond
        ) {
          try {
            diamondWithPricing =
              await window.DiamondPricing.applyMarkupToDiamond(diamond);
            console.log(
              '[DIAMOND CART] Applied markup to diamond:',
              diamondWithPricing
            );
          } catch (error) {
            console.warn(
              '[DIAMOND CART] Failed to apply markup, using original pricing:',
              error
            );
          }
        }

        // Step 1: Create or get existing variant
        const variantResult =
          await this.createDiamondVariant(diamondWithPricing);

        if (!variantResult.success) {
          throw new Error(variantResult.error || 'Failed to create variant');
        }

        // Step 2: Add variant to Shopify cart
        const cartResult = await this.addVariantToShopifyCart(
          variantResult.variantId
        );

        if (!cartResult.success) {
          throw new Error(cartResult.error || 'Failed to add to cart');
        }

        this.state.lastAddedVariantId = variantResult.variantId;

        // Show success feedback on button
        this.showButtonSuccess();

        return {
          success: true,
          variantId: variantResult.variantId,
          cartData: cartResult.cart,
          isExisting: variantResult.isExisting,
        };
      } catch (error) {
        console.error('[DIAMOND CART] Error adding diamond to cart:', error);
        this.showButtonError(error.message);
        return {
          success: false,
          error: error.message,
        };
      } finally {
        this.state.isAddingToCart = false;
      }
    },

    // Create a Shopify variant for the diamond
    async createDiamondVariant(diamond) {
      try {
        // App proxy authentication - Shopify handles authentication automatically
        const response = await fetch('/apps/api/diamonds/create-variant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            diamond,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Variant creation failed');
        }

        console.log('[DIAMOND CART] Variant created/found:', {
          variantId: data.variantId,
          sku: data.sku,
          isExisting: data.isExisting,
        });

        return data;
      } catch (error) {
        console.error('[DIAMOND CART] Error creating variant:', error);
        throw error;
      }
    },

    // Add variant to Shopify cart using Ajax API
    async addVariantToShopifyCart(variantId) {
      try {
        // Extract numeric ID from GraphQL ID
        const numericId = variantId.split('/').pop();

        const cartData = {
          items: [
            {
              id: parseInt(numericId),
              quantity: 1,
            },
          ],
        };

        const response = await fetch('/cart/add.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(cartData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Cart add failed: ${errorText}`);
        }

        const cart = await response.json();

        console.log('[DIAMOND CART] Successfully added to cart:', cart);

        // Trigger multiple cart update events to match theme behavior
        
        // 1. Standard Shopify cart events
        if (typeof window.Shopify !== 'undefined') {
          if (window.Shopify.onCartUpdate) {
            window.Shopify.onCartUpdate(cart);
          }
          
          // Trigger cart drawer update if available
          if (window.Shopify.theme && window.Shopify.theme.cart) {
            window.Shopify.theme.cart.updateDrawer();
          }
        }

        // 2. CartJS library support
        if (typeof window.CartJS !== 'undefined') {
          window.CartJS.getCart();
        }

        // 3. Theme-specific events (common patterns)
        const cartEvents = [
          'cart:updated',
          'cart:change', 
          'cart:refresh',
          'shopify:cart:updated',
          'theme:cart:updated'
        ];
        
        cartEvents.forEach(eventName => {
          window.dispatchEvent(
            new CustomEvent(eventName, {
              detail: { cart, addedVariantId: variantId },
              bubbles: true
            })
          );
        });

        // 4. Try to trigger form submission events
        const addToCartEvent = new CustomEvent('product:added-to-cart', {
          detail: { 
            variant_id: parseInt(variantId.split('/').pop()),
            quantity: 1,
            cart: cart
          },
          bubbles: true
        });
        document.dispatchEvent(addToCartEvent);

        return {
          success: true,
          cart: cart,
        };
      } catch (error) {
        console.error('[DIAMOND CART] Error adding to cart:', error);
        throw error;
      }
    },

    // Update add to cart button state
    updateAddToCartButton(isLoading) {
      const button = document.getElementById('add-to-cart-button');
      if (!button) return;

      if (isLoading) {
        button.disabled = true;
        button.innerHTML = `
          <div class="tw-flex tw-items-center tw-justify-center">
            <svg class="tw-animate-spin tw-h-4 tw-w-4 tw-mr-2" viewBox="0 0 24 24">
              <circle class="tw-opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
              <path class="tw-opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Lägger till...
          </div>
        `;
        button.classList.add('tw-opacity-50');
      } else {
        button.disabled = false;
        button.textContent = 'Lägg till i kundvagn';
        button.classList.remove('tw-opacity-50');
      }
    },

    // Show success on button
    showButtonSuccess() {
      const button = document.getElementById('add-to-cart-button');
      if (!button) return;

      button.disabled = false;
      button.textContent = 'Tillagd!';
      button.classList.remove('tw-opacity-50');
      button.classList.add('tw-bg-green-600', 'tw-text-black');

      // Update cart count if theme has cart counter
      this.updateCartCounter();

      // Reset button after 3 seconds
      setTimeout(() => {
        if (button) {
          button.textContent = 'Lägg till i kundvagn';
          button.classList.remove('tw-bg-green-600', 'tw-text-black');
        }
      }, 3000);
    },

    // Show error on button
    showButtonError(errorMessage) {
      const button = document.getElementById('add-to-cart-button');
      if (!button) return;

      button.disabled = false;
      button.textContent = 'Fel';
      button.classList.remove('tw-opacity-50');
      button.classList.add('tw-bg-red-600', 'tw-text-black');

      console.error('[DIAMOND CART] Error:', errorMessage);

      // Reset button after 3 seconds
      setTimeout(() => {
        if (button) {
          button.textContent = 'Lägg till i kundvagn';
          button.classList.remove('tw-bg-red-600', 'tw-text-black');
        }
      }, 3000);
    },

    // Update cart counter in theme
    updateCartCounter() {
      // Try to get current cart count
      fetch('/cart.js')
        .then((response) => response.json())
        .then((cart) => {
          // More comprehensive cart counter selectors
          const cartCountSelectors = [
            '.cart-count',
            '[data-cart-count]',
            '.cart-item-count',
            '.cart__count',
            '.header__cart-count',
            '.cart-counter',
            '.js-cart-item-count',
            '#cart-item-count',
            '.cart-link .count',
            '[data-cart-item-count]',
            '.cart-count-bubble',
            '.header-cart-count'
          ];
          
          cartCountSelectors.forEach(selector => {
            const counters = document.querySelectorAll(selector);
            counters.forEach((counter) => {
              counter.textContent = cart.item_count;
              counter.innerHTML = cart.item_count;
              if (counter.setAttribute) {
                counter.setAttribute('data-count', cart.item_count);
              }
            });
          });

          // Update cart drawer if theme supports it
          if (
            typeof window.theme !== 'undefined' &&
            window.theme.cart &&
            window.theme.cart.updateCartDrawer
          ) {
            window.theme.cart.updateCartDrawer();
          }

          // Trigger theme-specific cart updates
          if (typeof window.theme !== 'undefined') {
            if (window.theme.updateCart) {
              window.theme.updateCart();
            }
            if (window.theme.refreshCart) {
              window.theme.refreshCart();
            }
          }
        })
        .catch((error) => {
          console.warn('[DIAMOND CART] Could not update cart counter:', error);
        });
    },

    // Initialize cart functionality
    initialize() {
      console.log('[DIAMOND CART] Initializing cart functionality');

      // Set up add to cart button if it exists
      const addToCartButton = document.getElementById('add-to-cart-button');
      if (addToCartButton) {
        addToCartButton.addEventListener('click', async (event) => {
          event.preventDefault();

          // Get current diamond from state
          const currentDiamond = window.DiamondState?.getCurrentDiamond();
          if (!currentDiamond) {
            this.showCartError('Ingen diamant vald');
            return;
          }

          await this.addDiamondToCart(currentDiamond);
        });
      }
    },
  };
}
