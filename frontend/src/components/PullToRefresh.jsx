import React, { useRef, useState } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';

const THRESHOLD = 70; // px of pull needed to trigger a refresh
const MAX_PULL = 100;

// A native app-style pull-to-refresh gesture, since this is an installed
// PWA meant to feel like one — not the browser's own pull-to-refresh
// (which reloads the whole page and is disabled anyway via
// `overscroll-behavior-y: none` in index.css to stop iOS rubber-banding).
// Only activates when the page is already scrolled to the very top.
export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const active = useRef(false);

  const onTouchStart = (e) => {
    if (window.scrollY > 0 || refreshing) return;
    active.current = true;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e) => {
    if (!active.current || window.scrollY > 0) return;
    const delta = e.touches[0].clientY - startY.current;
    setPullDistance(delta > 0 ? Math.min(delta * 0.5, MAX_PULL) : 0);
  };

  const onTouchEnd = async () => {
    if (!active.current) return;
    active.current = false;
    if (pullDistance >= THRESHOLD) {
      setRefreshing(true);
      setPullDistance(THRESHOLD);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  };

  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div
        className="flex items-center justify-center overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: pullDistance }}
      >
        {refreshing ? (
          <Loader2 className="w-5 h-5 animate-spin text-white/60" />
        ) : (
          <ArrowDown
            className="w-5 h-5 text-white/40 transition-transform duration-150"
            style={{ transform: `rotate(${pullDistance >= THRESHOLD ? 180 : 0}deg)` }}
          />
        )}
      </div>
      {children}
    </div>
  );
}
