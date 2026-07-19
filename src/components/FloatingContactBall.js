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
      title="Contact us on WhatsApp"
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
      <span aria-hidden="true">WA</span>
    </a>
  );
}
