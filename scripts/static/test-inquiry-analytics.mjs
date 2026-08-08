import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import vm from 'node:vm';

const source = await readFile(resolve('static-pilot/runtime/inquiry-analytics.js'), 'utf8');

const run = (hostname) => {
  const listeners = new Map();
  const appendedScripts = [];

  class FakeElement {
    constructor(href, sourceLocation) {
      this.href = href;
      this.dataset = { inquirySource: sourceLocation };
    }
    closest(selector) { return selector === 'a[href]' ? this : null; }
    getAttribute(name) { return name === 'href' ? this.href : null; }
  }

  class FakeCustomEvent {
    constructor(type, init = {}) { this.type = type; this.detail = init.detail; }
  }

  const document = {
    head: { append(node) { appendedScripts.push(node); } },
    createElement() { return {}; },
    addEventListener(type, listener) { listeners.set(type, listener); },
    dispatchEvent(event) { listeners.get(event.type)?.(event); }
  };
  const window = { location: { hostname, pathname: '/contact' } };
  const context = vm.createContext({ window, document, Element: FakeElement, CustomEvent: FakeCustomEvent });
  vm.runInContext(source, context);

  listeners.get('click')({ target: new FakeElement('mailto:annawei@nameerbag.com?subject=Source%3A%20customwaistbag.com', 'header-email') });
  listeners.get('click')({ target: new FakeElement('https://wa.me/8615102249548?text=Source%3A%20customwaistbag.com', 'floating-whatsapp') });
  window.CWBInquiryAnalytics.trackFormSuccess('contact-form');

  return {
    dataLayer: (window.dataLayer || []).map((entry) => Array.from(entry)),
    appendedScripts
  };
};

const production = run('www.customwaistbag.com');
const preview = run('pilot.example.vercel.app');
const events = production.dataLayer.filter((entry) => entry[0] === 'event').map((entry) => entry[1]);
const expected = ['mailto_click', 'whatsapp_click', 'inquiry_form_submit'];

if (JSON.stringify(events) !== JSON.stringify(expected)) throw new Error(`Unexpected Production events: ${JSON.stringify(events)}`);
if (production.appendedScripts.length !== 1 || !production.appendedScripts[0].src.includes('G-Z2YYZR4LL0')) throw new Error('Production GA4 loader was not attached');
if (preview.dataLayer.length !== 0 || preview.appendedScripts.length !== 0) throw new Error('Preview must not send or load GA4');
if (production.dataLayer.some((entry) => JSON.stringify(entry).includes('annawei@nameerbag.com'))) throw new Error('Analytics payload contains email PII');

console.log(JSON.stringify({ ok: true, events, previewEvents: preview.dataLayer.length, productionLoader: true, piiInPayload: false }, null, 2));
