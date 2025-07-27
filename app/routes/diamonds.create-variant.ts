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

    // Calculate final price with markup
    let finalPrice = '0.00';
    if (diamond.finalPriceSek && typeof diamond.finalPriceSek === 'number') {
      // Use final price with markup if available
      finalPrice = (diamond.finalPriceSek / 100).toFixed(2); // Convert from öre to SEK
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

    // Create variant using productVariantsBulkCreate
    const createVariantMutation = `
      mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
        productVariantsBulkCreate(productId: $productId, variants: $variants) {
          productVariants {
            id
            barcode
            price
            displayName
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

    const variantInput = {
      barcode: sku,
      price: finalPrice,
      inventoryPolicy: 'CONTINUE', // Allow purchasing even when out of stock
      taxable: true,
      ...(optionValues.length > 0 ? { optionValues } : {})
    };

    const createVariantResponse = await admin.graphql(createVariantMutation, {
      variables: {
        productId: DIAMOND_PRODUCT_ID,
        variants: [variantInput],
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
    });
  } catch (error) {
    console.error('Error creating diamond variant:', error);
    return json(
      { error: 'Internal server error while creating variant' },
      { status: 500 }
    );
  }
}
