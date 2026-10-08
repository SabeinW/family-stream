import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard.jsx';

// A Netflix-style row: title with an "Explore all" link that slides out on
// hover, snap-scrolling tiles that bleed past the page gutter, and paddle
// arrows that only appear when there's somewhere to scroll.
export default function Carousel({ title, items, size = 'md', to, children }) {
  const scrollerRef = useRef(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [updateEdges, items]);

  const hasContent = children || (items && items.length > 0);
  if (!hasContent) return null;

  // Page by ~one viewport of tiles rather than a fixed pixel amount.
  const page = (dir) => {
    const el = scrollerRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
  };

  return (
    <section className="relative group/row mb-8 md:mb-10">
      <div className="px-4 md:px-12 mb-1 flex items-baseline gap-3">
        {to ? (
          <Link to={to} className="group/title flex items-baseline gap-2">
            <h2 className="font-display text-lg md:text-xl font-bold tracking-tight">{title}</h2>
            <span className="flex items-center text-xs font-semibold text-accent-glow opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-300 ease-cinema">
              Explore all <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </Link>
        ) : (
          <h2 className="font-display text-lg md:text-xl font-bold tracking-tight">{title}</h2>
        )}
      </div>

      <div className="relative">
        {!edges.start && (
          <button
            onClick={() => page(-1)}
            aria-label={`Scroll ${title} left`}
            className="hidden md:flex absolute left-0 inset-y-3 z-20 w-12 items-center justify-center bg-base-950/60 hover:bg-base-950/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronLeft className="w-8 h-8 transition-transform hover:scale-125" />
          </button>
        )}

        <div
          ref={scrollerRef}
          onScroll={updateEdges}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hidden snap-x snap-mandatory scroll-px-4 md:scroll-px-12 px-4 md:px-12 py-3"
        >
          {children || items.map((media) => <MediaCard key={media.id} media={media} size={size} />)}
        </div>

        {!edges.end && (
          <button
            onClick={() => page(1)}
            aria-label={`Scroll ${title} right`}
            className="hidden md:flex absolute right-0 inset-y-3 z-20 w-12 items-center justify-center bg-base-950/60 hover:bg-base-950/80 opacity-0 group-hover/row:opacity-100 transition-opacity"
          >
            <ChevronRight className="w-8 h-8 transition-transform hover:scale-125" />
          </button>
        )}
      </div>
    </section>
  );
}
