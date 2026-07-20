'use client';

import { useState } from 'react';

const endpoint = 'https://formsubmit.co/ajax/annawei@nameerbag.com';
const site = 'customwaistbag.com';

export function InquiryForm({ locale = 'en', product = 'Custom Waist Bag Project' }) {
  const ru = locale === 'ru';
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    if (formData.get('_honey')) return;

    const payload = new FormData();
    payload.set('name', formData.get('name') || '');
    payload.set('email', formData.get('email') || '');
    payload.set('quantity', formData.get('quantity') || '');
    payload.set('product', product);
    payload.set('message', formData.get('details') || '');
    payload.set('source_site', site);
    payload.set('_subject', `[${site}] New Inquiry - ${product}`);
    payload.set('_template', 'table');
    payload.set('_captcha', 'false');
    payload.set('_honey', '');

    setSending(true);
    setStatus(ru ? 'Отправляем запрос...' : 'Sending your inquiry...');
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: payload
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== 'true') throw new Error('Submission failed');
      form.reset();
      setStatus(ru ? 'Спасибо! Мы ответим в течение 24 часов.' : "Thank you, we'll reply within 24 hours.");
    } catch {
      setStatus(ru ? 'Не удалось отправить форму. Свяжитесь с нами по WhatsApp или email.' : 'The form could not be sent. Please use WhatsApp or email us directly.');
    } finally {
      setSending(false);
    }
  }

  const success = status.startsWith(ru ? 'Спасибо' : 'Thank you');
  const failed = status.startsWith(ru ? 'Не удалось' : 'The form could not');

  return (
    <form className="form-grid inquiry-form" onSubmit={onSubmit}>
      <input className="form-honey" type="text" name="_honey" tabIndex="-1" autoComplete="off" aria-hidden="true" />
      <label>{ru ? 'Имя' : 'Name'}<input name="name" required autoComplete="name" /></label>
      <label>Email<input name="email" type="email" required autoComplete="email" /></label>
      <label className="wide">{ru ? 'Планируемое количество' : 'Target quantity'}<input name="quantity" required inputMode="numeric" /></label>
      <label className="wide">{ru ? 'Описание проекта' : 'Project details'}<textarea name="details" required /></label>
      <button className="button wide" type="submit" disabled={sending}>{sending ? (ru ? 'Отправка...' : 'Sending...') : (ru ? 'Отправить запрос' : 'Send Inquiry')}</button>
      <p className={`form-status wide ${success ? 'success' : failed ? 'error' : ''}`} aria-live="polite">{status}</p>
    </form>
  );
}
