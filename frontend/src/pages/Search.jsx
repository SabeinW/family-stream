import React, { useEffect, useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import MediaCard from '../components/MediaCard.jsx';
import { api } from '../lib/api';

export default function Search() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [categories, setCategories] = useState([]);
  const [results, setResults] = useState([]);

  useEffect(() => { api.categories().then(setCategories); }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      api.listMedia({
        ...(query ? { search: query } : {}),
        ...(category ? { category } : {}),
        ...(type ? { type } : {}),
      }).then(setResults);
    }, 250); // debounce keystrokes
    return () => clearTimeout(t);
  }, [query, category, type]);

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 md:px-10">
        <div className="relative max-w-xl mb-6">
          <SearchIcon className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, tag, or description…"
            className="w-full bg-base-800 rounded-full pl-12 pr-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
        </div>

        <div className="flex flex-wrap gap-3 mb-8">
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="bg-base-800 rounded-md px-3 py-2 text-sm ring-1 ring-white/10 outline-none"
          >
            <option value="">All types</option>
            <option value="video">Videos</option>
            <option value="photo">Photos</option>
          </select>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-base-800 rounded-md px-3 py-2 text-sm ring-1 ring-white/10 outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {results.length === 0 ? (
          <p className="text-white/50">No matches yet — try a different search.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {results.map((m) => (
              <MediaCard key={m.id} media={m} size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
