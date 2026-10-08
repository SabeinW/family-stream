import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ImageIcon, Images } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export function formatDuration(sec) {
  if (!sec) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
export function isNew(media) {
  return media.createdAt && Date.now() - new Date(media.createdAt).getTime() < NEW_WINDOW_MS;
}

// `size="fill"` takes the width of its grid cell (Search, etc.); the others
// are fixed widths for horizontal rows.
const WIDTHS = { sm: 'w-40 md:w-48', md: 'w-56 md:w-64', lg: 'w-64 md:w-80', fill: 'w-full' };

export default function MediaCard({ media, size = 'md' }) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const progress =
    media.positionSec && media.durationSec ? Math.min(1, media.positionSec / media.durationSec) : null;

  return (
    <motion.button
      onClick={() => navigate(`/watch/${media.id}`)}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 320, damping: 26 }}
      className={`relative flex-shrink-0 snap-start ${WIDTHS[size]} text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg`}
      aria-label={media.title}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-base-800 shadow-card ring-1 ring-white/[0.06] group-hover:ring-white/20 group-hover:shadow-glow transition-shadow duration-300">
        {media.thumbnailPath ? (
          <>
            {!loaded && <div className="absolute inset-0 skeleton" />}
            <img
              src={api.thumbnailUrl(media.id)}
              alt=""
              loading="lazy"
              decoding="async"
              onLoad={() => setLoaded(true)}
              className={`w-full h-full object-cover transition-[opacity,transform] duration-700 ease-cinema group-hover:scale-105 ${
                loaded ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/25 bg-gradient-to-br from-base-700 to-base-900">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        {/* Legibility scrim for the in-tile title */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

        {isNew(media) && !progress && (
          <span className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-accent to-accent-glow shadow">
            New
          </span>
        )}

        {/* Hover play affordance */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="w-11 h-11 rounded-full bg-white/90 text-black flex items-center justify-center shadow-lg scale-90 group-hover:scale-100 transition-transform duration-300">
            {media.type === 'video' ? <Play className="w-5 h-5 fill-black ml-0.5" /> : <Images className="w-5 h-5" />}
          </span>
        </div>

        <div
          className={`absolute inset-x-0 bottom-0 px-2.5 flex items-end justify-between gap-2 ${
            progress !== null ? 'pb-4' : 'pb-2'
          }`}
        >
          <p className="text-[13px] md:text-sm font-semibold leading-tight line-clamp-2 drop-shadow">{media.title}</p>
          {media.durationSec && !progress && (
            <span className="shrink-0 text-[10px] font-medium text-white/80 tabular-nums">
              {formatDuration(media.durationSec)}
            </span>
          )}
        </div>

        {progress !== null && (
          <div className="absolute inset-x-2.5 bottom-1.5 h-[3px] rounded-full bg-white/25 overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${progress * 100}%` }} />
          </div>
        )}
      </div>
    </motion.button>
  );
}
