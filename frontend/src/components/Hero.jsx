import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import ShareControl from './ShareControl.jsx';

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

              <div className="mt-6 pt-6 border-t border-white/10">
                <ShareControl mediaId={media.id} isOwner={media.ownerId === user?.id} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
