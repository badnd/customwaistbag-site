'use client';

import { useEffect, useRef, useState } from 'react';

export function EmailUsLink({ email, subject, label = 'Email Us', className = '', onClick }) {
  const [showFallback, setShowFallback] = useState(false);
  const [copied, setCopied] = useState(false);
  const dismissTimer = useRef(null);
  const protocolTimer = useRef(null);
  const frameTimer = useRef(null);
  const frameRef = useRef(null);
  const href = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

  const clearTimers = () => {
    window.clearTimeout(dismissTimer.current);
    window.clearTimeout(protocolTimer.current);
    window.clearTimeout(frameTimer.current);
  };

  const scheduleDismiss = () => {
    window.clearTimeout(dismissTimer.current);
    dismissTimer.current = window.setTimeout(() => {
      setShowFallback(false);
      setCopied(false);
    }, 3200);
  };

  const copyEmail = async () => {
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(email);
      didCopy = true;
    } catch {
      const field = document.createElement('textarea');
      field.value = email;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      didCopy = document.execCommand('copy');
      field.remove();
    }
    setCopied(didCopy);
    setShowFallback(true);
    scheduleDismiss();
  };

  const handleClick = (event) => {
    event.preventDefault();
    onClick?.();
    setCopied(false);
    setShowFallback(true);
    copyEmail();
    window.clearTimeout(protocolTimer.current);
    protocolTimer.current = window.setTimeout(() => {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.tabIndex = -1;
      frame.style.display = 'none';
      frame.src = href;
      frameRef.current = frame;
      document.body.appendChild(frame);
      frameTimer.current = window.setTimeout(() => {
        frame.remove();
        frameRef.current = null;
      }, 1500);
    }, 0);
  };

  const handleCopy = (event) => {
    event.preventDefault();
    event.stopPropagation();
    copyEmail();
  };

  useEffect(() => () => {
    clearTimers();
    frameRef.current?.remove();
  }, []);

  return (
    <span className="email-fallback-wrap">
      <a className={className} href={href} onClick={handleClick}>{label}</a>
      {showFallback ? (
        <span className="email-fallback" role="status">
          {copied ? 'Email copied to clipboard' : `Email: ${email}`}
          <button type="button" onClick={handleCopy}>Copy email</button>
        </span>
      ) : null}
    </span>
  );
}
