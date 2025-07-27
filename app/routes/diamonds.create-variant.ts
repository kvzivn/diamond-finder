import type { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';

const DIAMOND_PRODUCT_ID = 'gid://shopify/Product/10209833189703';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: 'Method not allowed' }, { status: 405 });
  }

  try {
    // Use app proxy authentication
    const { admin } = await authenticate.public.appProxy(request);
    
    if (!admin) {
      return json({ error: 'No admin access available' }, { status: 401 });
    }

    const body = await request.json();
    const { diamond } = body;
    if (!diamond) {
      return json({ error: 'Diamond data is required' }, { status: 400 });
    }

    // Generate SKU from certificate number or fallback to id
    const sku = diamond.certificateNumber || `DIAMOND-${diamond.id}`;

    // Check if variant with this SKU already exists and get product options
    const existingVariantQuery = `
      query checkExistingVariant($productId: ID!) {
        product(id: $productId) {
          options {
            id
            name
            values
          }
          variants(first: 250) {
            edges {
              node {
                id
                barcode
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    `;

    const existingVariantResponse = await admin.graphql(existingVariantQuery, {
      variables: {
        productId: DIAMOND_PRODUCT_ID,
      },
    });

    const existingVariantData = await existingVariantResponse.json();

    // Get product options to use for variant creation
    const productOptions = existingVariantData.data?.product?.options || [];
    console.log('Product options:', productOptions);

    // Find variant with matching SKU (now using barcode field)
    const existingVariant = existingVariantData.data?.product?.variants?.edges?.find(
      (edge: any) => edge.node.barcode === sku
    );

    if (existingVariant) {
      // Return existing variant ID if found
      return json({
        success: true,
        variantId: existingVariant.node.id,
        sku: existingVariant.node.barcode,
        isExisting: true,
        diamond: diamond, // Include the diamond data in the response
        imageUrl: diamond.imageUrl || diamond.imagePath || null, // Include the image URL
      });
    }

    // Format diamond details for variant title
    const caratWeight = diamond.carat ? `${diamond.carat}ct` : 'Unknown carat';
    const shape = diamond.cut || 'Unknown shape';
    const color = diamond.color || 'Unknown color';
    const clarity = diamond.clarity || 'Unknown clarity';
    const certificateNum = diamond.certificateNumber
      ? ` - ${diamond.certificateNumber}`
      : '';

    const variantTitle = `${caratWeight} ${shape} ${color} ${clarity}${certificateNum}`;

    // Calculate final price with markup - prioritize finalPriceSek
    let finalPrice = '0.00';
    if (diamond.finalPriceSek && typeof diamond.finalPriceSek === 'number') {
      // Use final price with markup if available (already in SEK)
      finalPrice = diamond.finalPriceSek.toFixed(2);
    } else if (
      diamond.totalPriceSek &&
      typeof diamond.totalPriceSek === 'number'
    ) {
      // Round to nearest 100 SEK for consistency
      const roundedPrice = Math.round(diamond.totalPriceSek / 100) * 100;
      finalPrice = (roundedPrice / 100).toFixed(2); // Convert to currency format
    } else if (diamond.totalPrice && typeof diamond.totalPrice === 'number') {
      finalPrice = diamond.totalPrice.toFixed(2);
    }

    // Get diamond image URL (priority: imagePath > imageUrl > SVG fallback)
    let imageUrl = '';
    if (diamond.imagePath) {
      imageUrl = diamond.imagePath;
    } else if (diamond.imageUrl) {
      imageUrl = diamond.imageUrl;
    } else {
      // Generate SVG fallback URL for diamond shape
      const shape = diamond.cut || 'round';
      imageUrl = `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
          <polygon points="50,10 80,40 50,90 20,40" fill="#e5e7eb" stroke="#9ca3af" stroke-width="2"/>
          <text x="50" y="55" text-anchor="middle" font-family="Arial" font-size="12" fill="#6b7280">${shape}</text>
        </svg>
      `)}`;
    }

    // Create variant using productVariantsBulkCreate with media support
    const createVariantMutation = `
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!, $media: [CreateMediaInput!]) {
        productVariantsBulkCreate(productId: $productId, variants: $variants, media: $media) {
          productVariants {
            id
            barcode
            price
            displayName
            media(first: 1) {
              nodes {
                id
                alt
                ... on MediaImage {
                  image {
                    url
                  }
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    // Create option values based on product's configured options
    const optionValues = [];
    if (productOptions.length > 0) {
      // Use the first option for the variant title
      optionValues.push({
        optionName: productOptions[0].name,
        name: variantTitle
      });
    }

    // Prepare media array and variant input with media association
    const mediaArray = [];
    const variantInput = {
      barcode: sku,
      price: finalPrice,
      inventoryPolicy: 'CONTINUE', // Allow purchasing even when out of stock
      taxable: true,
      ...(optionValues.length > 0 ? { optionValues } : {})
    };

    // Add media if diamond has an image (either imageUrl or imagePath)
    const realImageUrl = diamond.imageUrl || diamond.imagePath;
    if (realImageUrl && !realImageUrl.startsWith('data:')) {
      // Only add real URLs, not data URLs (SVG fallbacks)
      mediaArray.push({
        originalSource: realImageUrl,
        alt: `${diamond.carat}ct ${diamond.cut} ${diamond.color} ${diamond.clarity} - ${diamond.certificateNumber}`,
        mediaContentType: 'IMAGE'
      });
      
      // Associate the media with the variant
      variantInput.mediaSrc = [realImageUrl];
      
      console.log(`Creating variant with image: ${realImageUrl}`);
    } else {
      console.log('No real image URL found for diamond, variant will be created without image');
    }

    const createVariantResponse = await admin.graphql(createVariantMutation, {
      variables: {
        productId: DIAMOND_PRODUCT_ID,
        variants: [variantInput],
        media: mediaArray,
      },
    });

    const createVariantData = await createVariantResponse.json();

    if (
      createVariantData.data?.productVariantsBulkCreate?.userErrors?.length > 0
    ) {
      const errors =
        createVariantData.data.productVariantsBulkCreate.userErrors;
      console.error('Variant creation errors:', errors);
      return json(
        {
          error: 'Failed to create variant',
          details: errors.map((e: any) => e.message).join(', '),
        },
        { status: 400 }
      );
    }

    const createdVariant =
      createVariantData.data?.productVariantsBulkCreate?.productVariants?.[0];

    if (!createdVariant) {
      return json(
        { error: 'Failed to create variant - no variant returned' },
        { status: 500 }
      );
    }

    return json({
      success: true,
      variantId: createdVariant.id,
      sku: createdVariant.barcode,
      title: createdVariant.displayName,
      price: createdVariant.price,
      isExisting: false,
      diamond: diamond, // Include the diamond data in the response
      imageUrl: realImageUrl || null, // Include the image URL used
    });
  } catch (error) {
    console.error('Error creating diamond variant:', error);
    return json(
      { error: 'Internal server error while creating variant' },
      { status: 500 }
    );
  }
}
