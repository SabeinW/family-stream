import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Film, UploadCloud } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import Hero from '../components/Hero.jsx';
import Carousel from '../components/Carousel.jsx';
import PlaylistCover from '../components/PlaylistCover.jsx';
import PullToRefresh from '../components/PullToRefresh.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api';

const FEATURED_COUNT = 5;

function PlaylistTile({ playlist }) {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(`/playlists/${playlist.id}`)}
      className="flex-shrink-0 snap-start w-56 md:w-64 text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg"
    >
      <div className="rounded-lg overflow-hidden ring-1 ring-white/[0.06] shadow-card transition duration-300 ease-cinema group-hover:-translate-y-1 group-hover:ring-white/20">
        <PlaylistCover coverColor={playlist.coverColor} thumbnails={playlist.coverThumbnails} />
      </div>
      <p className="mt-2 text-sm font-semibold text-white/90 truncate">{playlist.name}</p>
      <p className="text-xs text-white/45">
        {playlist.itemCount} {playlist.itemCount === 1 ? 'item' : 'items'}
      </p>
    </button>
  );
}

function oneYearAgoRange() {
  const now = new Date();
  const start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() - 3);
  const end = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate() + 3);
  return [start, end];
}

// Billboard picks: items with artwork, videos first (they can preview),
// shuffled so the home screen feels fresh on every visit.
function pickFeatured(media) {
  const withArt = media.filter((m) => m.thumbnailPath);
  const shuffle = (arr) => arr.map((m) => [Math.random(), m]).sort((a, b) => a[0] - b[0]).map(([, m]) => m);
  const videos = shuffle(withArt.filter((m) => m.type === 'video'));
  const photos = shuffle(withArt.filter((m) => m.type !== 'video'));
  const picks = [...videos, ...photos].slice(0, FEATURED_COUNT);
  return picks.length ? picks : media.slice(0, 1);
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-base-950" aria-busy="true" aria-label="Loading">
      <div className="h-[60vh] md:h-[85vh] skeleton" />
      <div className="-mt-24 relative px-4 md:px-12 space-y-10">
        {[0, 1, 2].map((row) => (
          <div key={row}>
            <div className="h-5 w-40 rounded skeleton mb-4" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex-shrink-0 w-56 md:w-64 aspect-video rounded-lg skeleton" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [media, setMedia] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState([]);
  const [continueWatching, setContinueWatching] = useState([]);
  const [featured, setFeatured] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [all, favs, lists, resume] = await Promise.all([
      api.listMedia(),
      api.favorites().catch(() => []),
      api.listPlaylists().catch(() => []),
      api.continueWatching().catch(() => []),
    ]);
    setMedia(all);
    setFavorites(favs);
    setPlaylists(lists);
    setContinueWatching(resume);
    setFeatured(pickFeatured(all));
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);

  // Optimistic My List toggle — flips immediately, rolls back on failure.
  const toggleFavorite = useCallback(
    async (item) => {
      const had = favoriteIds.has(item.id);
      setFavorites((prev) => (had ? prev.filter((f) => f.id !== item.id) : [item, ...prev]));
      try {
        await api.toggleFavorite(item.id);
      } catch {
        setFavorites((prev) => (had ? [item, ...prev] : prev.filter((f) => f.id !== item.id)));
      }
    },
    [favoriteIds]
  );

  const recent = useMemo(() => media.slice(0, 20), [media]);
  const newThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return media.filter((m) => new Date(m.createdAt).getTime() > weekAgo);
  }, [media]);
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

  if (loading) return <DashboardSkeleton />;

  if (!media.length) {
    return (
      <PullToRefresh onRefresh={load}>
        <div className="min-h-screen bg-base-950">
          <Navbar />
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
          >
            <div className="relative mb-6">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-40"
                style={{ backgroundColor: 'rgb(var(--accent-rgb))' }}
                aria-hidden="true"
              />
              <div
                className="relative w-20 h-20 rounded-full flex items-center justify-center ring-1 ring-white/10"
                style={{ backgroundImage: 'linear-gradient(135deg, rgb(var(--accent-rgb) / 0.3), rgb(var(--accent-glow-rgb) / 0.15))' }}
              >
                <Film className="w-9 h-9 text-white" />
              </div>
            </div>
            <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-3">No memories yet</p>
            <h1 className="font-display font-bold text-3xl md:text-4xl tracking-tight mb-3">Add your first photo or video</h1>
            <p className="text-white/50 text-sm max-w-sm mb-8">
              Everything you upload stays private until you decide to share it with family or friends.
            </p>
            <button
              onClick={() => navigate('/upload')}
              className="flex items-center gap-2 bg-accent hover:bg-accent-dim transition-colors rounded-md px-6 py-3 font-semibold"
            >
              <UploadCloud className="w-5 h-5" /> Upload a memory
            </button>
          </motion.div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={load}>
      <div className="min-h-screen bg-base-950 pb-20">
        <Navbar />
        <Hero items={featured} favoriteIds={favoriteIds} onToggleFavorite={toggleFavorite} />

        {/* Rows tuck up into the billboard's fade on desktop, Netflix-style. */}
        <div className="relative z-10 md:-mt-[14vh]">
          {continueWatching.length > 0 && (
            <Carousel title={`Continue Watching for ${profile?.name || 'you'}`} items={continueWatching} />
          )}
          {newThisWeek.length > 0 && <Carousel title="New This Week" items={newThisWeek} />}
          {favorites.length > 0 && <Carousel title="My List" items={favorites} />}
          {memoriesAYearAgo.length > 0 && <Carousel title="On This Day, 1 Year Ago" items={memoriesAYearAgo} size="lg" />}
          <Carousel title="Recently Added" items={recent} />
          {playlists.length > 0 && (
            <Carousel title="Your Playlists" to="/playlists">
              {playlists.map((p) => (
                <PlaylistTile key={p.id} playlist={p} />
              ))}
            </Carousel>
          )}
          <Carousel title="Videos" items={videos.slice(0, 20)} to="/search?type=video" />
          {vacations.length > 0 && <Carousel title="Vacations" items={vacations} size="lg" />}
          <Carousel title="Photo Highlights" items={photos.slice(0, 20)} size="sm" to="/search?type=photo" />

          {Object.entries(categorized)
            .filter(([cat]) => !['Uncategorized', 'Vacations'].includes(cat))
            .map(([cat, items]) => (
              <Carousel key={cat} title={cat} items={items} to={`/search?category=${encodeURIComponent(cat)}`} />
            ))}
        </div>
      </div>
    </PullToRefresh>
  );
}
