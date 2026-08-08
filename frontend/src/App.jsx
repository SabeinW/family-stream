import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { useAuth } from './context/AuthContext.jsx';
import Login from './pages/Login.jsx';
import ProfileSelect from './pages/ProfileSelect.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Watch from './pages/Watch.jsx';
import Upload from './pages/Upload.jsx';
import Search from './pages/Search.jsx';
import Settings from './pages/Settings.jsx';
import Friends from './pages/Friends.jsx';
import Playlists from './pages/Playlists.jsx';
import PlaylistDetail from './pages/PlaylistDetail.jsx';

function RequireAuth({ children }) {
  const { isAuthed } = useAuth();
  return isAuthed ? children : <Navigate to="/login" replace />;
}

function RequireProfile({ children }) {
  const { isAuthed, hasProfile } = useAuth();
  if (!isAuthed) return <Navigate to="/login" replace />;
  if (!hasProfile) return <Navigate to="/profiles" replace />;
  return children;
}

// Every navigation crosses through this — a deliberately quiet opacity-only
// fade (no y/scale) so it never fights with the fixed-positioned navbars and
// top bars every page renders. A transform-based fade would create a new
// containing block for those `position: fixed` children, silently breaking
// them for the transition's duration.
function PageTransition({ children }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        <Route
          path="/profiles"
          element={
            <RequireAuth>
              <PageTransition><ProfileSelect /></PageTransition>
            </RequireAuth>
          }
        />
        <Route
          path="/"
          element={
            <RequireProfile>
              <PageTransition><Dashboard /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/search"
          element={
            <RequireProfile>
              <PageTransition><Search /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/watch/:id"
          element={
            <RequireProfile>
              <PageTransition><Watch /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/upload"
          element={
            <RequireProfile>
              <PageTransition><Upload /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/settings"
          element={
            <RequireProfile>
              <PageTransition><Settings /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/friends"
          element={
            <RequireProfile>
              <PageTransition><Friends /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/playlists"
          element={
            <RequireProfile>
              <PageTransition><Playlists /></PageTransition>
            </RequireProfile>
          }
        />
        <Route
          path="/playlists/:id"
          element={
            <RequireProfile>
              <PageTransition><PlaylistDetail /></PageTransition>
            </RequireProfile>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}
