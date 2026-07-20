import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Play, Pause } from 'lucide-react';
import { api } from '../lib/api';

const PHOTO_DURATION_MS = 5000;

// Full-screen auto-advancing viewer for a playlist's items. Photos advance
// on a fixed timer; videos advance when they finish playing (their own
// length sets the pace instead of a guessed duration).
export default function Slideshow({ items, startIndex = 0, onClose }) {
  const [index, setIndex] = useState(startIndex);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const rafRef = useRef(null);

  const current = items[index];

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  // Photo auto-advance + progress bar (rAF-driven so it's smooth, not a
  // series of visible jumps from a low-frequency setInterval).
  useEffect(() => {
    setProgress(0);
    if (!current || current.type !== 'photo' || !playing) return;

    const start = performance.now();
    const tick = (now) => {
      const pct = Math.min(1, (now - start) / PHOTO_DURATION_MS);
      setProgress(pct);
      if (pct >= 1) {
        next();
      } else {
        rafRef.current = requestAnimationFrame(tick);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [current, playing, next]);

  // Videos: play/pause follows `playing`; advance when the clip ends.
  useEffect(() => {
    const v = videoRef.current;
    if (!v || !current || current.type !== 'video') return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, current]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'ArrowRight') next();
      if (e.code === 'ArrowLeft') prev();
      if (e.code === 'Space') { e.preventDefault(); setPlaying((p) => !p); }
      if (e.code === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev, onClose]);

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-black flex items-center justify-center"
    >
      {/* Progress bars — one per item, filled up to `progress` for the current one */}
      <div className="absolute top-0 inset-x-0 z-10 flex gap-1 p-3 safe-top">
        {items.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
            <div
              className="h-full bg-white"
              style={{ width: `${i < index ? 100 : i === index ? progress * 100 : 0}%` }}
            />
          </div>
        ))}
      </div>

      <button onClick={onClose} aria-label="Close slideshow" className="absolute top-6 right-4 z-10 p-2 rounded-full hover:bg-white/10">
        <X className="w-6 h-6" />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full h-full flex items-center justify-center"
        >
          {current.type === 'photo' ? (
            <img src={api.photoUrl(current.id)} alt={current.title} className="max-h-full max-w-full object-contain" />
          ) : (
            <video
              ref={videoRef}
              src={api.streamUrl(current.id)}
              className="max-h-full max-w-full object-contain"
              autoPlay
              muted
              playsInline
              onEnded={next}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-0 inset-x-0 z-10 flex items-center justify-between p-4 safe-bottom bg-gradient-to-t from-black/70 to-transparent">
        <p className="text-sm text-white/80 truncate max-w-[50%]">{current.title}</p>
        <div className="flex items-center gap-4">
          <button onClick={prev} aria-label="Previous" className="p-2 rounded-full hover:bg-white/10">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Play'} className="p-2 rounded-full hover:bg-white/10">
            {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button onClick={next} aria-label="Next" className="p-2 rounded-full hover:bg-white/10">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
