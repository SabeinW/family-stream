import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import MediaCard from '../components/MediaCard.jsx';
import { api } from '../lib/api';

const TYPES = [
  { value: '', label: 'All' },
  { value: 'video', label: 'Videos' },
  { value: 'photo', label: 'Photos' },
];

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`shrink-0 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ring-1 ${
        active ? 'bg-white text-black ring-white' : 'bg-white/5 text-white/75 ring-white/10 hover:bg-white/10 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function Search() {
  // Filters live in the URL so nav links (Videos / Photos / a row's
  // "Explore all") can deep-link into a filtered view.
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const category = params.get('category') || '';
  const [query, setQuery] = useState(params.get('q') || '');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState(null);

  const setParam = (key, value) => {
    const nextParams = new URLSearchParams(params);
    if (value) nextParams.set(key, value);
    else nextParams.delete(key);
    setParams(nextParams, { replace: true });
  };

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api
        .listMedia({
          ...(query ? { search: query } : {}),
          ...(category ? { category } : {}),
          ...(type ? { type } : {}),
        })
        .then(setResults)
        .catch(() => setResults([]));
    }, 250); // debounce keystrokes
    return () => clearTimeout(t);
  }, [query, category, type]);

  const heading = type === 'video' ? 'Videos' : type === 'photo' ? 'Photos' : category || 'Browse';

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-[calc(env(safe-area-inset-top)+5rem)] md:pt-28 px-4 md:px-12">
        <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-5">{heading}</h1>

        <div className="relative max-w-2xl mb-5">
          <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            autoFocus={!type && !category}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Titles, tags, descriptions…"
            enterKeyHint="search"
            className="w-full bg-white/[0.06] rounded-xl pl-12 pr-11 py-3.5 text-[15px] outline-none ring-1 ring-white/10 focus:ring-2 focus:ring-accent focus:bg-white/[0.08] transition placeholder:text-white/35"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0 mb-2">
          {TYPES.map((t) => (
            <Chip key={t.value} active={type === t.value} onClick={() => setParam('type', t.value)}>
              {t.label}
            </Chip>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hidden -mx-4 px-4 md:mx-0 md:px-0 mb-8">
            <Chip active={!category} onClick={() => setParam('category', '')}>
              All categories
            </Chip>
            {categories.map((c) => (
              <Chip key={c} active={category === c} onClick={() => setParam('category', c)}>
                {c}
              </Chip>
            ))}
          </div>
        )}

        {results === null ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-video rounded-lg skeleton" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-lg font-semibold mb-1">Nothing matches that yet</p>
            <p className="text-white/50 text-sm">Try a different word, or clear a filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
            {results.map((m) => (
              <MediaCard key={m.id} media={m} size="fill" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
