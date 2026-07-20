import React from 'react';
import { motion } from 'framer-motion';
import { Play, ImageIcon, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

function formatDuration(sec) {
  if (!sec) return null;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function MediaCard({ media, size = 'md' }) {
  const navigate = useNavigate();
  const widths = { sm: 'w-36 md:w-44', md: 'w-44 md:w-56', lg: 'w-56 md:w-72' };

  return (
    <motion.button
      onClick={() => navigate(`/watch/${media.id}`)}
      whileHover={{ scale: 1.06, zIndex: 10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className={`relative flex-shrink-0 ${widths[size]} text-left group focus:outline-none focus-visible:ring-2 focus-visible:ring-accent rounded-lg`}
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-base-800 shadow-card ring-1 ring-white/5">
        {media.thumbnailPath ? (
          <img
            src={api.thumbnailUrl(media.id)}
            alt={media.title}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30">
            <ImageIcon className="w-8 h-8" />
          </div>
        )}

        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          {media.type === 'video' && (
            <Play className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
          )}
        </div>

        {media.durationSec && (
          <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-black/70 text-[10px] px-1.5 py-0.5 rounded">
            <Clock className="w-3 h-3" /> {formatDuration(media.durationSec)}
          </span>
        )}
      </div>
      <p className="mt-1.5 text-sm text-white/90 truncate">{media.title}</p>
    </motion.button>
  );
}
