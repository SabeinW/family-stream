import React from 'react';
import { motion } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function Hero({ media }) {
  const navigate = useNavigate();
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

      <div className="relative h-full flex flex-col justify-end px-4 md:px-12 pb-16 max-w-2xl">
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
          className="font-display text-5xl md:text-7xl tracking-wide leading-none mb-4 drop-shadow-lg"
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
          <button className="flex items-center gap-2 bg-white/15 backdrop-blur px-6 py-2.5 rounded-md font-semibold hover:bg-white/25 transition-colors">
            <Info className="w-5 h-5" /> Details
          </button>
        </motion.div>
      </div>
    </div>
  );
}
