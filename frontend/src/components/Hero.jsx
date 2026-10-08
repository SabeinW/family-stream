import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Play, Info, X, Plus, Check, Volume2, VolumeX, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import ShareControl from './ShareControl.jsx';
import { LogoMark } from './Logo.jsx';
import { formatDuration, isNew } from './MediaCard.jsx';

const ROTATE_MS = 9000;
const PREVIEW_DELAY_MS = 2500;
const PREVIEW_MAX_MS = 30000;
const EASE = [0.16, 1, 0.3, 1];

// Muted billboard previews are a desktop nicety: skip them on small screens,
// for reduced-motion users, and when the browser asks to save data.
function canPreview(reduceMotion) {
  if (reduceMotion || typeof window === 'undefined') return false;
  if (navigator.connection?.saveData) return false;
  return window.matchMedia('(min-width: 768px)').matches;
}

function MetaRow({ media }) {
  const date = media.takenAt || media.createdAt;
  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs md:text-sm text-white/80 font-medium">
      {isNew(media) && <span className="text-accent-glow font-bold">New</span>}
      {date && <span>{new Date(date).getFullYear()}</span>}
      {media.durationSec ? <span>{formatDuration(media.durationSec)}</span> : null}
      <span className="px-1.5 py-px rounded border border-white/30 text-[10px] md:text-xs uppercase tracking-wide">
        {media.type === 'video' ? 'Video' : 'Photo'}
      </span>
      {media.category && media.category !== 'Uncategorized' && <span className="text-white/60">{media.category}</span>}
    </div>
  );
}

export default function Hero({ items = [], favoriteIds, onToggleFavorite }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  const count = items.length;
  // Modulo guards against a refresh returning fewer picks than `index`.
  const media = count ? items[index % count] : undefined;

  const next = useCallback(() => setIndex((i) => (count ? (i + 1) % count : 0)), [count]);

  // Reset the preview whenever the spotlighted item changes.
  useEffect(() => {
    setPreviewing(false);
    setPreviewReady(false);
  }, [media?.id]);

  // Start a muted preview after a beat on video items (desktop only).
  useEffect(() => {
    if (!media || media.type !== 'video' || showDetails || !canPreview(reduceMotion)) return;
    const t = setTimeout(() => setPreviewing(true), PREVIEW_DELAY_MS);
    return () => clearTimeout(t);
  }, [media, showDetails, reduceMotion]);

  // Auto-rotate, paused while a preview plays, details are open, or the tab
  // is hidden. A preview ends the slide itself (on `ended` or a time cap).
  useEffect(() => {
    if (count < 2 || showDetails) return;
    if (previewing) {
      const cap = setTimeout(next, PREVIEW_MAX_MS);
      return () => clearTimeout(cap);
    }
    const t = setTimeout(() => {
      if (!document.hidden) next();
    }, ROTATE_MS);
    return () => clearTimeout(t);
  }, [count, index, previewing, showDetails, next]);

  if (!media) {
    return (
      <div className="relative h-[72vh] md:h-[85vh] w-full">
        <div className="absolute inset-0 skeleton" />
      </div>
    );
  }

  const art = media.thumbnailPath ? api.thumbnailUrl(media.id) : null;
  const inList = favoriteIds?.has(media.id);
  const primary = () => navigate(`/watch/${media.id}`);

  const actions = (compact = false) => (
    <div className={`flex items-center gap-2.5 ${compact ? 'w-full' : ''}`}>
      <button
        onClick={primary}
        className={`flex items-center justify-center gap-2 bg-white text-black font-semibold rounded-md hover:bg-white/85 active:scale-[0.98] transition ${
          compact ? 'flex-1 py-2.5' : 'px-7 py-2.5 md:py-3 text-base md:text-lg'
        }`}
      >
        {media.type === 'video' ? <Play className="w-5 h-5 fill-black" /> : <Images className="w-5 h-5" />}
        {media.type === 'video' ? 'Play' : 'View'}
      </button>
      {compact ? (
        <button
          onClick={() => onToggleFavorite?.(media)}
          className="flex-1 flex items-center justify-center gap-2 bg-white/15 backdrop-blur font-semibold rounded-md py-2.5 hover:bg-white/25 active:scale-[0.98] transition"
        >
          {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />} My List
        </button>
      ) : (
        <>
          <button
            onClick={() => setShowDetails(true)}
            className="flex items-center gap-2 bg-white/20 backdrop-blur px-6 py-2.5 md:py-3 text-base md:text-lg rounded-md font-semibold hover:bg-white/30 transition-colors"
          >
            <Info className="w-5 h-5" /> More Info
          </button>
          <button
            onClick={() => onToggleFavorite?.(media)}
            aria-label={inList ? 'Remove from My List' : 'Add to My List'}
            title={inList ? 'Remove from My List' : 'Add to My List'}
            className="w-11 h-11 md:w-12 md:h-12 rounded-full flex items-center justify-center ring-2 ring-white/50 bg-black/30 backdrop-blur hover:ring-white transition"
          >
            {inList ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          </button>
        </>
      )}
    </div>
  );

  const dots = (className = '') =>
    count > 1 ? (
      <div className={`flex gap-1.5 ${className}`}>
        {items.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setIndex(i)}
            aria-label={`Show ${m.title}`}
            className={`h-1 rounded-full transition-all duration-500 ease-cinema ${
              i === index % count ? 'w-6 bg-white' : 'w-2.5 bg-white/35 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    ) : null;

  return (
    <>
      {/* ===== Mobile: floating poster card over its own ambient glow ===== */}
      <div className="md:hidden relative pt-[calc(env(safe-area-inset-top)+4.5rem)] pb-6 px-5 overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={`amb-${media.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 bg-cover bg-center scale-150 blur-3xl opacity-50"
            style={{ backgroundImage: art ? `url(${art})` : undefined }}
            aria-hidden="true"
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-base-950/30 via-base-950/40 to-base-950" aria-hidden="true" />

        <motion.div
          drag={count > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next();
            else if (info.offset.x > 60) setIndex((i) => (i - 1 + count) % count);
          }}
          className="relative aspect-[4/5] max-h-[62vh] w-full rounded-2xl overflow-hidden shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)] ring-1 ring-white/15"
        >
          <AnimatePresence initial={false}>
            <motion.div
              key={media.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0 bg-base-800 bg-cover bg-center"
              style={{ backgroundImage: art ? `url(${art})` : undefined }}
              onClick={() => setShowDetails(true)}
            />
          </AnimatePresence>
          <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col items-center text-center gap-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.25em] uppercase text-white/80">
              <LogoMark className="w-3.5 h-3.5" /> {media.category || 'Family'}
            </p>
            <h1 className="font-display text-3xl font-extrabold tracking-tight leading-[1.05] line-clamp-2 drop-shadow-lg">
              {media.title}
            </h1>
            <MetaRow media={media} />
            {actions(true)}
          </div>
        </motion.div>
        {dots('relative justify-center mt-4')}
      </div>

      {/* ===== Desktop: full-bleed billboard ===== */}
      <div className="hidden md:block relative h-[85vh] min-h-[560px] w-full overflow-hidden">
        <AnimatePresence initial={false}>
          <motion.div
            key={media.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.1, ease: 'easeInOut' }}
            className="absolute inset-0"
          >
            <div
              className="absolute inset-0 bg-base-900 bg-cover bg-center animate-kenburns"
              style={{ backgroundImage: art ? `url(${art})` : undefined }}
            />
          </motion.div>
        </AnimatePresence>

        {previewing && (
          <video
            ref={videoRef}
            key={`pv-${media.id}`}
            src={api.streamUrl(media.id)}
            autoPlay
            muted={muted}
            playsInline
            onPlaying={() => setPreviewReady(true)}
            onEnded={next}
            onError={() => setPreviewing(false)}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              previewReady ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}

        <div className="absolute inset-0 bg-hero-side" />
        <div className="absolute inset-0 bg-hero-fade" />

        <AnimatePresence mode="wait">
          <motion.div
            key={media.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.7, ease: EASE }}
            className="relative h-full flex flex-col justify-end px-12 pb-[22vh] max-w-3xl"
          >
            <p className="flex items-center gap-2 text-xs font-bold tracking-[0.3em] uppercase text-white/85 mb-4">
              <LogoMark className="w-4 h-4" /> {media.category || 'Family'}
            </p>
            <h1
              className={`font-display font-extrabold tracking-tight leading-[0.95] mb-5 drop-shadow-[0_4px_24px_rgba(0,0,0,0.5)] line-clamp-2 origin-bottom-left transition-transform duration-1000 ease-cinema ${
                previewReady ? 'text-5xl lg:text-6xl' : 'text-6xl lg:text-7xl'
              }`}
            >
              {media.title}
            </h1>
            <div className="mb-4">
              <MetaRow media={media} />
            </div>
            {/* Netflix shrinks the synopsis away once the preview takes over. */}
            <AnimatePresence>
              {media.description && !previewReady && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.6, ease: EASE }}
                  className="text-white/85 text-base lg:text-lg leading-snug mb-7 line-clamp-3 max-w-xl drop-shadow"
                >
                  {media.description}
                </motion.p>
              )}
            </AnimatePresence>
            <div className={previewReady || !media.description ? 'mt-3' : ''}>
              {actions()}
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute right-12 bottom-[22vh] flex items-center gap-4">
          {previewReady && (
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? 'Unmute preview' : 'Mute preview'}
              className="w-11 h-11 rounded-full ring-1 ring-white/60 bg-black/30 backdrop-blur flex items-center justify-center hover:bg-white/10 transition"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          {dots()}
        </div>
      </div>

      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm md:px-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: EASE }}
              className="relative w-full md:max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hidden bg-base-900 rounded-t-2xl md:rounded-2xl ring-1 ring-white/10 shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative aspect-video bg-base-800 bg-cover bg-center" style={{ backgroundImage: art ? `url(${art})` : undefined }}>
                <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/20 to-transparent" />
                <button
                  onClick={() => setShowDetails(false)}
                  aria-label="Close details"
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-base-950/80 flex items-center justify-center hover:bg-base-950 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute left-6 right-6 bottom-5">
                  <h2 className="font-display text-3xl md:text-4xl font-extrabold tracking-tight leading-tight mb-4 drop-shadow-lg">
                    {media.title}
                  </h2>
                  {actions()}
                </div>
              </div>

              <div className="px-6 pb-6 pt-2">
                <div className="mb-4">
                  <MetaRow media={media} />
                </div>
                {media.takenAt && (
                  <p className="text-white/50 text-sm mb-3">
                    Captured{' '}
                    {new Date(media.takenAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                <p className="text-white/80 text-sm md:text-base whitespace-pre-wrap">
                  {media.description || 'No description added yet.'}
                </p>
                {media.tags && (
                  <p className="text-white/50 text-sm mt-4">
                    <span className="text-white/35">Tags: </span>
                    {media.tags.split(',').filter(Boolean).join(', ')}
                  </p>
                )}

                <div className="mt-6 pt-6 border-t border-white/10">
                  <ShareControl mediaId={media.id} isOwner={media.ownerId === user?.id} />
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
