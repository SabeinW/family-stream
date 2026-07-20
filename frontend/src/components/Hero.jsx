import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, X, Loader2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Private — only me' },
  { id: 'friends', label: 'All friends' },
  { id: 'custom', label: 'Specific friends' },
];

function ShareControl({ mediaId, isOwner }) {
  const [loaded, setLoaded] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [shareWith, setShareWith] = useState([]);
  const [friends, setFriends] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    Promise.all([api.getMedia(mediaId), api.listFriends()]).then(([full, friendData]) => {
      setVisibility(full.visibility);
      setShareWith((full.shares || []).map((s) => s.userId));
      setFriends(friendData.friends);
      setLoaded(true);
    });
  }, [mediaId, isOwner]);

  if (!isOwner) return null;
  if (!loaded) return <Loader2 className="w-4 h-4 animate-spin text-white/40 mt-4" />;

  const toggleFriend = (userId) => {
    setShareWith((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.updateVisibility(mediaId, { visibility, shareWith: visibility === 'custom' ? shareWith : undefined });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-6 pt-6 border-t border-white/10">
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Sharing</h3>
      <div className="flex flex-col gap-2 mb-3">
        {VISIBILITY_OPTIONS.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="visibility"
              checked={visibility === opt.id}
              onChange={() => { setVisibility(opt.id); setSaved(false); }}
              className="accent-current text-accent"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {visibility === 'custom' && (
        <div className="max-h-32 overflow-y-auto scrollbar-hidden space-y-1.5 mb-3 pl-1">
          {friends.length === 0 ? (
            <p className="text-white/40 text-xs">No friends yet — add some from the Friends page.</p>
          ) : (
            friends.map((f) => (
              <label key={f.userId} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareWith.includes(f.userId)}
                  onChange={() => { toggleFriend(f.userId); setSaved(false); }}
                />
                {f.email}
              </label>
            ))
          )}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
        {saved ? 'Saved' : 'Save sharing'}
      </button>
      {error && <p className="text-accent text-xs mt-2">{error}</p>}
    </div>
  );
}

export default function Hero({ media }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);
  if (!media) return <div className="h-[70vh] bg-base-900 animate-pulse" />;

  const bgUrl = media.thumbnailPath ? api.thumbnailUrl(media.id) : null;

  return (
    <div className="relative h-[78vh] md:h-[85vh] w-full overflow-hidden">
      {/* Blurred, oversized background fill */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-110 blur-sm opacity-60"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined, backgroundColor: '#0b0b0d' }}
      />
      {/* Sharp centered artwork */}
      <motion.div
        initial={{ opacity: 0, scale: 1.05 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: bgUrl ? `url(${bgUrl})` : undefined }}
      />

      <div className="absolute inset-0 bg-hero-fade" />
      <div className="absolute inset-0 bg-hero-side" />

      <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-24 max-w-2xl">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-accent font-semibold tracking-widest text-xs md:text-sm uppercase mb-3"
        >
          {media.category}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.7 }}
          className="font-display text-5xl md:text-7xl tracking-wide leading-none mb-4 drop-shadow-lg line-clamp-2"
        >
          {media.title}
        </motion.h1>
        {media.description && (
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7 }}
            className="text-white/80 text-sm md:text-base mb-6 line-clamp-3"
          >
            {media.description}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="flex gap-3"
        >
          {media.type === 'video' && (
            <button
              onClick={() => navigate(`/watch/${media.id}`)}
              className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-md hover:bg-white/85 transition-colors"
            >
              <Play className="w-5 h-5 fill-black" /> Play
            </button>
          )}
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-2 bg-white/15 backdrop-blur px-6 py-2.5 rounded-md font-semibold hover:bg-white/25 transition-colors"
          >
            <Info className="w-5 h-5" /> Details
          </button>
        </motion.div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto scrollbar-hidden bg-base-900 rounded-xl ring-1 ring-white/10 shadow-card p-6 md:p-8"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowDetails(false)}
                aria-label="Close details"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <p className="text-accent font-semibold tracking-widest text-xs uppercase mb-2">
                {media.category}
              </p>
              <h2 className="font-display text-3xl md:text-4xl tracking-wide leading-tight mb-3 pr-8">
                {media.title}
              </h2>
              {media.takenAt && (
                <p className="text-white/50 text-sm mb-4">
                  {new Date(media.takenAt).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
              <p className="text-white/80 text-sm md:text-base mb-6 whitespace-pre-wrap">
                {media.description || 'No description added yet.'}
              </p>

              <button
                onClick={() => navigate(`/watch/${media.id}`)}
                className="flex items-center gap-2 bg-white text-black font-semibold px-6 py-2.5 rounded-md hover:bg-white/85 transition-colors"
              >
                <Play className="w-5 h-5 fill-black" /> {media.type === 'video' ? 'Play' : 'View'}
              </button>

              <ShareControl mediaId={media.id} isOwner={media.ownerId === user?.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
