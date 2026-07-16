# customwaistbag.com Deployment Guide

## 1. Local preview
Do not judge data-loading pages only by double-clicking HTML. Start a local server in this folder:

```bash
python -m http.server 8080
```

Open: `http://localhost:8080/`

## 2. Upload
Upload the contents of this folder to the web root so `index.html`, `assets/`, `products/`, `robots.txt` and `sitemap.xml` remain at the first level.

## 3. Contact information
Current official information:
- Tianjin Junyi Premium Trading Co.,Ltd.
- annawei@nameerbag.com
- WhatsApp +86 151 0224 9548
- WeChat 15102249548

Main configuration files:
- `assets/data/site-config.json`
- `assets/js/config.js`

SEO metadata and visible footer/header text also need updating if official details change.

## 4. Logo
Header logo: `assets/images/brand/nameer-logo-header.png`
Footer logo: `assets/images/brand/nameer-logo-white.png`
Favicon: `favicon.ico`

Keep the original proportions. Product mockups should use `YOUR LOGO`, not the factory Nameer logo.

## 5. Images and videos
Use English filenames and relative paths.
- Factory images: `assets/images/factory/`
- Customization: `assets/images/customization/`
- Videos: `assets/videos/`
- Video posters: `assets/videos/posters/`

## 6. Add a product
1. Prepare optimized images.
2. Add the product record to `assets/data/products.json`.
3. Set `status` to `published`.
4. Copy `products/product-template.html` to a unique slug filename.
5. Replace title, description, canonical, schema, images and specifications.
6. Add the product URL to `sitemap.xml`.
7. Test all links and redeploy.

Public product data must not rely only on browser localStorage.

## 7. Add a category
Edit `assets/data/categories.json`. Product filters are generated from that file.

## 8. Hidden editor
Click the top-left Nameer logo five times within three seconds. Open the full editor.
The editor can:
- import JSON
- format JSON
- save a browser-only preview draft
- export `products.json`

To publish, replace `assets/data/products.json` and redeploy.

## 9. Languages
UI translation files:
- `assets/lang/en.json`
- `assets/lang/es.json`
- `assets/lang/fr.json`

Missing translated product content should fall back to English in future product templates.

## 10. Domain changes
Update:
- all canonical tags
- Open Graph URLs
- structured data URLs
- `robots.txt`
- `sitemap.xml`
- `assets/data/site-config.json`

## 11. Inquiry form
The static form does not fake a successful server submission. It prepares:
- a real email draft
- a real WhatsApp message
- copied inquiry text

## 12. Product template indexing
`products/product-template.html` is intentionally `noindex, nofollow` and is excluded from the sitemap.
