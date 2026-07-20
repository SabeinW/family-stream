import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, Share2, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import VideoPlayer from '../components/VideoPlayer.jsx';
import DeleteMediaButton from '../components/DeleteMediaButton.jsx';
import ShareControl from '../components/ShareControl.jsx';

export default function Watch() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [media, setMedia] = useState(null);
  const [theater, setTheater] = useState(false);
  const [showShare, setShowShare] = useState(false);

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
            onShareClick={() => setShowShare(true)}
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
              <div className="flex items-center gap-1">
                <a
                  href={api.downloadUrl(media.id)}
                  download
                  aria-label="Download"
                  className="p-2 rounded-full hover:bg-white/10 transition-colors"
                >
                  <Download className="w-5 h-5" />
                </a>
                {media.ownerId === user?.id && (
                  <>
                    <button
                      onClick={() => setShowShare(true)}
                      aria-label="Share"
                      className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                    <DeleteMediaButton mediaId={media.id} onDeleted={() => navigate('/')} />
                  </>
                )}
              </div>
            </div>
            <img src={api.photoUrl(media.id)} alt={media.title} className="max-h-screen max-w-full object-contain mx-auto" />
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowShare(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="relative w-full max-w-sm bg-base-900 rounded-xl ring-1 ring-white/10 shadow-card p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowShare(false)}
                aria-label="Close"
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <ShareControl mediaId={media.id} isOwner={media.ownerId === user?.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
