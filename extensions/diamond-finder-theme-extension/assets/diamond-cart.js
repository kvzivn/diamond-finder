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

        console.log('[DIAMOND CART] Variant result includes diamond data:', {
          hasDiamond: !!variantResult.diamond,
          diamondId: variantResult.diamond?.id,
          certificateNumber: variantResult.diamond?.certificateNumber,
          imageUrl: variantResult.imageUrl,
          isExisting: variantResult.isExisting
        });

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
          diamond: data.diamond,
          imageUrl: data.imageUrl,
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

        // Step 1: Add to cart
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

        const addResponse = await response.json();
        console.log('[DIAMOND CART] Item added to cart:', addResponse);

        // Step 2: Immediately fetch fresh cart state (recommended by Shopify)
        const cartResponse = await fetch('/cart.js');
        if (!cartResponse.ok) {
          throw new Error('Failed to fetch updated cart state');
        }
        
        const cart = await cartResponse.json();
        console.log('[DIAMOND CART] Fresh cart data:', cart);

        // Step 3: Update cart counter with fresh data
        this.updateCartCounterWithCartData(cart);

        // Step 4: Trigger events for theme compatibility
        this.triggerCartUpdateEvents(cart, variantId);

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

    // Update cart counter using provided cart data (recommended by Shopify)
    updateCartCounterWithCartData(cart) {
      console.log('[DIAMOND CART] Updating cart counter with cart data:', cart);
      
      // Check if cart-count-bubble exists, create it if it doesn't
      let cartCountBubble = document.querySelector('.cart-count-bubble');
      
      if (!cartCountBubble && cart.item_count > 0) {
        // Create the cart count bubble if it doesn't exist
        console.log('[DIAMOND CART] Cart count bubble not found, creating it');
        
        const cartIcon = document.getElementById('cart-icon-bubble');
        if (cartIcon) {
          cartCountBubble = document.createElement('div');
          cartCountBubble.className = 'cart-count-bubble';
          cartCountBubble.innerHTML = `<span aria-hidden="true">${cart.item_count}</span><span class="visually-hidden">${cart.item_count} item${cart.item_count !== 1 ? 's' : ''}</span>`;
          cartIcon.appendChild(cartCountBubble);
          console.log('[DIAMOND CART] Created cart count bubble');
          
          // Also update the cart icon SVG from empty to filled
          const emptyCartIcon = cartIcon.querySelector('.icon-cart-empty');
          if (emptyCartIcon) {
            emptyCartIcon.classList.remove('icon-cart-empty');
            emptyCartIcon.classList.add('icon-cart');
            // Update the SVG path for filled cart icon
            const path = emptyCartIcon.querySelector('path');
            if (path) {
              path.setAttribute('d', 'M20.5 6.5a4.75 4.75 0 00-4.75 4.75v.56h-3.16l-.77 11.6a5 5 0 004.99 5.34h7.38a5 5 0 004.99-5.33l-.77-11.6h-3.16v-.57A4.75 4.75 0 0020.5 6.5zm3.75 5.31v-.56a3.75 3.75 0 10-7.5 0v.56h7.5zm-7.5 1h7.5v.56a3.75 3.75 0 11-7.5 0v-.56zm-1 0v.56a4.75 4.75 0 109.5 0v-.56h2.22l.71 10.67a4 4 0 01-3.99 4.27h-7.38a4 4 0 01-4-4.27l.72-10.67h2.22z');
              console.log('[DIAMOND CART] Updated cart icon to filled state');
            }
          }
        }
      } else if (cartCountBubble) {
        // Update existing cart count bubble
        console.log('[DIAMOND CART] Found existing cart count bubble, updating');
        const cartCounterSpans = cartCountBubble.querySelectorAll('span');
        console.log(`[DIAMOND CART] Found ${cartCounterSpans.length} cart counter spans`);
        
        cartCounterSpans.forEach((span, index) => {
          const oldValue = span.textContent;
          if (index === 0) {
            // First span: just the number
            span.textContent = cart.item_count;
          } else {
            // Second span: "X item(s)"
            span.textContent = `${cart.item_count} item${cart.item_count !== 1 ? 's' : ''}`;
          }
          console.log(`[DIAMOND CART] Updated cart counter span ${index}: ${oldValue} → ${span.textContent}`);
        });
      }
      
      console.log(`[DIAMOND CART] Cart counter updated to: ${cart.item_count}`);
      
      // Call theme-specific cart update functions
      this.callThemeCartFunctions();
    },

    // Trigger cart update events for theme compatibility
    triggerCartUpdateEvents(cart, variantId) {
      console.log('[DIAMOND CART] Triggering cart update events');
      
      // 1. Standard Shopify cart events
      if (typeof window.Shopify !== 'undefined') {
        if (window.Shopify.onCartUpdate) {
          console.log('[DIAMOND CART] Calling Shopify.onCartUpdate()');
          window.Shopify.onCartUpdate(cart);
        }
        
        // Trigger cart drawer update if available
        if (window.Shopify.theme && window.Shopify.theme.cart) {
          console.log('[DIAMOND CART] Calling Shopify.theme.cart.updateDrawer()');
          window.Shopify.theme.cart.updateDrawer();
        }
      }

      // 2. CartJS library support
      if (typeof window.CartJS !== 'undefined') {
        console.log('[DIAMOND CART] Calling CartJS.getCart()');
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
        console.log(`[DIAMOND CART] Dispatching event: ${eventName}`);
        window.dispatchEvent(
          new CustomEvent(eventName, {
            detail: { cart, addedVariantId: variantId },
            bubbles: true
          })
        );
      });

      // 4. Product added event
      const addToCartEvent = new CustomEvent('product:added-to-cart', {
        detail: { 
          variant_id: parseInt(variantId.split('/').pop()),
          quantity: 1,
          cart: cart
        },
        bubbles: true
      });
      console.log('[DIAMOND CART] Dispatching product:added-to-cart event');
      document.dispatchEvent(addToCartEvent);
    },

    // Call theme-specific cart functions
    callThemeCartFunctions() {
      // Update cart drawer if theme supports it
      if (
        typeof window.theme !== 'undefined' &&
        window.theme.cart &&
        window.theme.cart.updateCartDrawer
      ) {
        console.log('[DIAMOND CART] Calling theme.cart.updateCartDrawer()');
        window.theme.cart.updateCartDrawer();
      }

      // Trigger theme-specific cart updates
      if (typeof window.theme !== 'undefined') {
        if (window.theme.updateCart) {
          console.log('[DIAMOND CART] Calling theme.updateCart()');
          window.theme.updateCart();
        }
        if (window.theme.refreshCart) {
          console.log('[DIAMOND CART] Calling theme.refreshCart()');
          window.theme.refreshCart();
        }
      }
    },


    // Legacy cart counter update (fallback method)
    updateCartCounter() {
      console.log('[DIAMOND CART] Using legacy cart counter update method');
      
      fetch('/cart.js')
        .then((response) => response.json())
        .then((cart) => {
          this.updateCartCounterWithCartData(cart);
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
