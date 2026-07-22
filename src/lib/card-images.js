const CDN = 'https://images.customwaistbag.com/assets/products';
const blogModels = ['ydjl2035','ydjl1923','ydjl2025'];
export const productCardImage = (product) => `${CDN}/${product.model.toLowerCase()}/thumb-card.webp`;
export const blogCardImage = (index) => `${CDN}/${blogModels[index % blogModels.length]}/thumb-card.webp`;
