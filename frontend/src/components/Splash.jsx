import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { LogoMark } from './Logo.jsx';

const SESSION_KEY = 'fs_splash_seen';
const HOLD_MS = 1300;

function alreadySeen() {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

// A short brand reveal on cold launch — the app's "ta-dum". It plays once per
// session (not on every navigation), sits over the app while the first
// screen loads underneath, then pushes through toward the viewer and fades.
export default function Splash() {
  const reduceMotion = useReducedMotion();
  const [show, setShow] = useState(() => !reduceMotion && !alreadySeen());

  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* private mode: just replays next time */
    }
    const t = setTimeout(() => setShow(false), HOLD_MS);
    return () => clearTimeout(t);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] bg-base-950 flex items-center justify-center"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <motion.div
            className="absolute w-[60vmin] h-[60vmin] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(124,92,255,0.45), rgba(255,61,139,0.15) 45%, transparent 70%)' }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.6 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.7, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 2.4, filter: 'blur(6px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <LogoMark className="w-24 h-24 md:w-28 md:h-28 drop-shadow-[0_0_30px_rgba(124,92,255,0.6)]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
