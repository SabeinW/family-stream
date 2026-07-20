import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import DeleteMediaButton from '../components/DeleteMediaButton.jsx';

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
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
          <VideoPlayer
            media={media}
            onTheaterChange={handleTheaterChange}
            isOwner={media.ownerId === user?.id}
            onDeleted={() => navigate('/')}
          />
        ) : (
          <>
            <div className="fixed top-0 inset-x-0 z-20 flex items-center justify-between p-4 safe-top bg-gradient-to-b from-black/80 to-transparent">
              <div className="flex items-center gap-3 min-w-0">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 shrink-0">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-sm md:text-base truncate">{media.title}</h3>
              </div>
              {media.ownerId === user?.id && <DeleteMediaButton mediaId={media.id} onDeleted={() => navigate('/')} />}
            </div>
            <img src={api.photoUrl(media.id)} alt={media.title} className="max-h-screen max-w-full object-contain mx-auto" />
          </>
        )}
      </motion.div>
    </div>
  );
}
