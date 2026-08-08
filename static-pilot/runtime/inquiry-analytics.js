(() => {
  'use strict';

  const measurementId = 'G-Z2YYZR4LL0';
  const siteDomain = 'customwaistbag.com';
  const isProductionHost = window.location.hostname === 'www.customwaistbag.com';
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };

  if (isProductionHost) {
    const loader = document.createElement('script');
    loader.async = true;
    loader.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(loader);
    window.gtag('js', new Date());
    window.gtag('config', measurementId, { send_page_view: true });
  }

  const emit = (eventName, sourceLocation = 'unspecified') => {
    if (!isProductionHost) return;
    window.gtag('event', eventName, {
      site_domain: siteDomain,
      source_location: sourceLocation,
      page_path: window.location.pathname,
      transport_type: 'beacon'
    });
  };

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : event.target?.parentElement;
    const link = target?.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href') || '';
    const source = link.dataset.inquirySource || link.closest('[data-inquiry-source]')?.dataset.inquirySource || 'link';
    if (href.startsWith('mailto:')) emit('mailto_click', source);
    if (/^https:\/\/(?:wa\.me|api\.whatsapp\.com)\//u.test(href)) emit('whatsapp_click', source);
  });

  document.addEventListener('cwb:form-success', (event) => {
    emit('inquiry_form_submit', event.detail?.sourceLocation || 'form');
  });

  window.CWBInquiryAnalytics = Object.freeze({
    trackFormSuccess(sourceLocation = 'form') {
      document.dispatchEvent(new CustomEvent('cwb:form-success', { detail: { sourceLocation } }));
    }
  });
})();
