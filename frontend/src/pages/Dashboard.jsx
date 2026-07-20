import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Carousel from '../components/Carousel.jsx';
import PlaylistCover from '../components/PlaylistCover.jsx';
import { api } from '../lib/api';

function PlaylistRow({ playlists }) {
  const navigate = useNavigate();
  if (!playlists.length) return null;
  return (
    <section className="relative mb-10 px-4 md:px-10">
      <h2 className="text-lg md:text-xl font-semibold mb-3">Your Playlists</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-hidden scroll-smooth pb-2">
        {playlists.map((p) => (
          <button
            key={p.id}
            onClick={() => navigate(`/playlists/${p.id}`)}
            className="flex-shrink-0 w-44 md:w-56 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
          >
            <PlaylistCover coverColor={p.coverColor} thumbnails={p.coverThumbnails} />
            <p className="mt-1.5 text-sm text-white/90 truncate">{p.name}</p>
            <p className="text-xs text-white/40">{p.itemCount} {p.itemCount === 1 ? 'item' : 'items'}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function oneYearAgoRange() {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 3);
  const end = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 3);
  return [start, end];
}

export default function Dashboard() {
  const [media, setMedia] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [spotlight, setSpotlight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.listMedia(), api.favorites().catch(() => []), api.listPlaylists().catch(() => [])]).then(
      ([all, favs, lists]) => {
        setMedia(all);
        setFavorites(favs);
        setPlaylists(lists);
        if (all.length) setSpotlight(all[Math.floor(Math.random() * all.length)]);
        setLoading(false);
      }
    );
  }, []);

  const recent = useMemo(() => [...media].slice(0, 20), [media]);
  const videos = useMemo(() => media.filter((m) => m.type === 'video'), [media]);
  const photos = useMemo(() => media.filter((m) => m.type === 'photo'), [media]);
  const vacations = useMemo(() => media.filter((m) => /vacation/i.test(m.category)), [media]);

  const memoriesAYearAgo = useMemo(() => {
    const [start, end] = oneYearAgoRange();
    return media.filter((m) => m.takenAt && new Date(m.takenAt) >= start && new Date(m.takenAt) <= end);
  }, [media]);

  const categorized = useMemo(() => {
    const map = {};
    media.forEach((m) => {
      if (!map[m.category]) map[m.category] = [];
      map[m.category].push(m);
    });
    return map;
  }, [media]);

  if (loading) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <div className="w-16 h-16 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!media.length) {
    return (
      <div className="min-h-screen bg-base-950">
        <Navbar />
        <div className="pt-32 text-center text-white/60 px-4">
          <p className="text-lg">No media yet — upload your first family memory to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <Hero media={spotlight} />

      <div className="-mt-16 relative z-10">
        <PlaylistRow playlists={playlists} />
        <Carousel title="Trending Family Moments" items={recent} />
        {favorites.length > 0 && <Carousel title="Your Favorites" items={favorites} />}
        {memoriesAYearAgo.length > 0 && <Carousel title="Memories from 1 Year Ago" items={memoriesAYearAgo} />}
        <Carousel title="Recent Videos" items={videos.slice(0, 20)} />
        {vacations.length > 0 && <Carousel title="Vacations" items={vacations} size="lg" />}
        <Carousel title="Photo Highlights" items={photos.slice(0, 20)} size="sm" />

        {Object.entries(categorized)
          .filter(([cat]) => !['Uncategorized', 'Vacations'].includes(cat))
          .map(([cat, items]) => (
            <Carousel key={cat} title={cat} items={items} />
          ))}
      </div>
    </div>
  );
}
