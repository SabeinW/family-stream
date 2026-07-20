import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import MediaCard from './MediaCard.jsx';

export default function Carousel({ title, items, size = 'md' }) {
  const scrollerRef = useRef(null);

  if (!items || items.length === 0) return null;

  const scrollBy = (delta) => {
    scrollerRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <section className="relative group/row mb-10 px-4 md:px-10">
      <h2 className="text-lg md:text-xl font-semibold mb-3">{title}</h2>

      <button
        onClick={() => scrollBy(-600)}
        aria-label="Scroll left"
        className="hidden md:flex absolute left-0 top-10 bottom-0 z-10 w-12 items-center justify-center bg-gradient-to-r from-base-950 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>

      <div ref={scrollerRef} className="flex gap-3 overflow-x-auto scrollbar-hidden scroll-smooth pb-2">
        {items.map((media) => (
          <MediaCard key={media.id} media={media} size={size} />
        ))}
      </div>

      <button
        onClick={() => scrollBy(600)}
        aria-label="Scroll right"
        className="hidden md:flex absolute right-0 top-10 bottom-0 z-10 w-12 items-center justify-center bg-gradient-to-l from-base-950 to-transparent opacity-0 group-hover/row:opacity-100 transition-opacity"
      >
        <ChevronRight className="w-8 h-8" />
      </button>
    </section>
  );
}
