import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../lib/api';
import VideoPlayer from '../components/VideoPlayer.jsx';

export default function Watch() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [theater, setTheater] = useState(false);

  useEffect(() => {
    api.getMedia(id).then(setMedia);
  }, [id]);

  // Theater mode dims everything outside the player and locks background
  // scroll, so the video feels like the only thing on screen — mirrors the
  // "cinema lights down" behavior of Netflix/YouTube theater mode.
  const handleTheaterChange = useCallback((on) => {
    setTheater(on);
    document.body.style.overflow = on ? 'hidden' : '';
  }, []);

  useEffect(() => () => { document.body.style.overflow = ''; }, []);

  if (!media) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative">
      <AnimatePresence>
        {theater && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-black pointer-events-none z-0"
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          width: theater ? '100%' : '100%',
          maxWidth: theater ? '100vw' : '1400px',
        }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full px-0 md:px-6"
      >
        {media.type === 'video' ? (
          <VideoPlayer media={media} onTheaterChange={handleTheaterChange} />
        ) : (
          <img src={api.photoUrl(media.id)} alt={media.title} className="max-h-screen max-w-full object-contain mx-auto" />
        )}
      </motion.div>
    </div>
  );
}
