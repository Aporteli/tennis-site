'use client';

import { useEffect, useRef, useState } from 'react';

interface MarqueeTextProps {
  children: string;
  className?: string;
  /** pixels per second — how fast the text slides */
  speed?: number;
  /** pause before the slide starts (ms) */
  delayMs?: number;
}

/**
 * Truncates long text by default. On hover, if the text doesn't fit,
 * it slides left until the end is visible, then snaps back on mouse-leave.
 *
 * Short text that already fits → no animation, no overhead.
 */
export function MarqueeText({
  children,
  className = '',
  speed = 60,
  delayMs = 200,
}: MarqueeTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(0);
  const [hovering, setHovering] = useState(false);

  useEffect(() => {
    const measure = () => {
      const c = containerRef.current;
      const t = textRef.current;
      if (!c || !t) return;
      const diff = t.scrollWidth - c.clientWidth;
      setOverflow(diff > 1 ? diff : 0);
    };

    measure();

    const ro = new ResizeObserver(measure);
    if (containerRef.current) ro.observe(containerRef.current);
    if (textRef.current) ro.observe(textRef.current);
    return () => ro.disconnect();
  }, [children]);

  const distance = overflow + 8; // small breathing room at the end
  const duration = distance / speed;
  const isOverflowing = overflow > 0;
  const active = hovering && isOverflowing;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden ${className}`}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <span
        ref={textRef}
        className="inline-block whitespace-nowrap will-change-transform"
        style={{
          transform: active ? `translateX(-${distance}px)` : 'translateX(0)',
          transition: active
            ? `transform ${duration}s linear ${delayMs}ms`
            : 'transform 200ms ease-out 0ms',
        }}
      >
        {children}
      </span>
    </div>
  );
}