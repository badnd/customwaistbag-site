'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

const BALL_SIZE = 64;
const EDGE_GAP = 16;
const DRAG_THRESHOLD = 10;
const TOUCH_HOLD_MS = 180;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function defaultPosition() {
  if (typeof window === 'undefined') return null;
  const mobile = window.innerWidth <= 600;
  return {
    x: window.innerWidth - BALL_SIZE - (mobile ? 16 : 22),
    y: window.innerHeight - BALL_SIZE - (mobile ? 84 : 22),
  };
}

export function FloatingContactBall({ siteName }) {
  const elementRef = useRef(null);
  const gestureRef = useRef(null);
  const suppressClickRef = useRef(false);
  const [position, setPosition] = useState(null);
  const message = useMemo(
    () => `Hi, I am contacting you from ${siteName}. I would like to discuss a custom bag project. Please send MOQ tiers, sample cost and lead time. - Anna Wei, Sales`,
    [siteName],
  );
  const href = `https://wa.me/8615102249548?text=${encodeURIComponent(message)}`;
  const side = position && position.x + BALL_SIZE / 2 < window.innerWidth / 2 ? 'left' : 'right';

  useEffect(() => {
    setPosition(defaultPosition());
    const onResize = () => {
      setPosition((current) => {
        const next = current || defaultPosition();
        return {
          x: clamp(next.x, EDGE_GAP, window.innerWidth - BALL_SIZE - EDGE_GAP),
          y: clamp(next.y, EDGE_GAP, window.innerHeight - BALL_SIZE - EDGE_GAP),
        };
      });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onPointerDown = (event) => {
    if (event.button !== undefined && event.button !== 0) return;
    const current = position || defaultPosition();
    const gesture = {
      pointerId: event.pointerId,
      pointerType: event.pointerType,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: current.x,
      startY: current.y,
      dragging: false,
      cancelled: false,
      armed: event.pointerType !== 'touch',
      timer: null,
    };
    if (event.pointerType === 'touch') {
      gesture.timer = window.setTimeout(() => {
        gesture.armed = true;
      }, TOUCH_HOLD_MS);
    }
    gestureRef.current = gesture;
  };

  const onPointerMove = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId || gesture.cancelled) return;
    const dx = event.clientX - gesture.startClientX;
    const dy = event.clientY - gesture.startClientY;
    const distance = Math.hypot(dx, dy);

    if (!gesture.dragging) {
      if (distance <= DRAG_THRESHOLD) return;
      if (!gesture.armed) {
        if (Math.abs(dy) > Math.abs(dx)) {
          gesture.cancelled = true;
          suppressClickRef.current = true;
          window.clearTimeout(gesture.timer);
        }
        return;
      }
      gesture.dragging = true;
      elementRef.current?.setPointerCapture?.(event.pointerId);
    }

    event.preventDefault();
    setPosition({
      x: clamp(gesture.startX + dx, EDGE_GAP, window.innerWidth - BALL_SIZE - EDGE_GAP),
      y: clamp(gesture.startY + dy, EDGE_GAP, window.innerHeight - BALL_SIZE - EDGE_GAP),
    });
  };

  const finishGesture = (event) => {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    window.clearTimeout(gesture.timer);
    if (gesture.dragging) {
      suppressClickRef.current = true;
      setPosition((current) => ({
        x: current.x + BALL_SIZE / 2 < window.innerWidth / 2
          ? EDGE_GAP
          : window.innerWidth - BALL_SIZE - EDGE_GAP,
        y: clamp(current.y, EDGE_GAP, window.innerHeight - BALL_SIZE - EDGE_GAP),
      }));
      elementRef.current?.releasePointerCapture?.(event.pointerId);
    }
    gestureRef.current = null;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  return (
    <a
      ref={elementRef}
      className="contact-ball"
      href={href}
      target="_blank"
      rel="noopener"
      aria-label="Contact us on WhatsApp"
      data-side={side}
      style={position ? { left: position.x, top: position.y } : undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={finishGesture}
      onPointerCancel={finishGesture}
      onClick={(event) => {
        if (suppressClickRef.current) event.preventDefault();
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      {/* WhatsApp brand glyph from Simple Icons (CC0-1.0). */}
      <svg className="whatsapp-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479s1.065 2.875 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.981.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 7.021 2.91 9.825 9.825 0 0 1 2.9 7.024c-.002 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.101-1.6a11.882 11.882 0 0 0 5.69 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
      </svg>
      <span className="contact-tooltip" aria-hidden="true">Chat on WhatsApp</span>
    </a>
  );
}
