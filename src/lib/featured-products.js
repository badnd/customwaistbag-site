// Fixed homepage featured capacity: CWB 8. New dated products enter automatically and the oldest drops out.
export const FEATURED_PRODUCT_CAPACITY = 8;

export function selectFeaturedProducts(products) {
  return products
    .map((product, sourceIndex) => ({ product, sourceIndex }))
    .sort((a, b) => {
      const dateA = Date.parse(a.product.publishedAt || '') || 0;
      const dateB = Date.parse(b.product.publishedAt || '') || 0;
      return dateB - dateA || a.sourceIndex - b.sourceIndex;
    })
    .slice(0, FEATURED_PRODUCT_CAPACITY)
    .map(({ product }) => product);
}
