const CDN = 'https://images.customwaistbag.com/assets/products';
const blogModels = ['ydjl2035','ydjl1923','ydjl2025'];
export const productCardImage = (product) => product.gallery[0];
export const blogCardImage = (index) => `${CDN}/${blogModels[index % blogModels.length]}/thumb-card.webp?v=20260723-2`;
