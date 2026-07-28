'use client';

import { useRef, useState } from 'react';

export function EmailUsLink({ email, subject, label = 'Email Us', className = '', onClick }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;
  const copyEmail = async () => { try { await navigator.clipboard.writeText(email); setCopied(true); } catch { const field = document.createElement('textarea'); field.value = email; field.setAttribute('readonly', ''); field.style.position = 'fixed'; field.style.opacity = '0'; document.body.appendChild(field); field.select(); setCopied(document.execCommand('copy')); field.remove(); } };
  const handleClick = () => { onClick?.(); copyEmail(); window.clearTimeout(timer.current); timer.current = window.setTimeout(() => { if (document.visibilityState === 'visible' && document.hasFocus()) setShowFallback(true); }, 900); };
  return <span className="email-fallback-wrap"><a className={className} href={href} onClick={handleClick}>{label}</a>{showFallback && <span className="email-fallback" role="status">{copied ? 'Email copied to clipboard' : `Email: ${email}`} <button type="button" onClick={copyEmail}>Copy email</button></span>}</span>;
}
