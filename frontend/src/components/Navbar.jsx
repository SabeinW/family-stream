import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, Plus, Home, ListVideo, Users, Settings, Repeat, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api';
import NotificationBell from './NotificationBell.jsx';
import Logo from './Logo.jsx';

// Desktop primary links. Videos/Photos are filtered views of Browse.
const LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Videos', to: '/search?type=video' },
  { label: 'Photos', to: '/search?type=photo' },
  { label: 'Playlists', to: '/playlists' },
  { label: 'Friends', to: '/friends' },
];

// Mobile bottom tabs — the pattern every native streaming app uses, so
// primary destinations sit under the thumb instead of in a crowded top bar.
const TABS = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Search', to: '/search', icon: Search },
  { label: 'Upload', to: '/upload', icon: Plus, primary: true },
  { label: 'Playlists', to: '/playlists', icon: ListVideo },
  { label: 'Friends', to: '/friends', icon: Users },
];

function isActive(location, to) {
  const [path, query] = to.split('?');
  if (path === '/') return location.pathname === '/';
  if (!location.pathname.startsWith(path)) return false;
  // "/search" only counts as active for the plain Browse tab when no type
  // filter is applied; "/search?type=video" must match that filter exactly.
  const type = new URLSearchParams(location.search).get('type');
  const wanted = query ? new URLSearchParams(query).get('type') : null;
  return path !== '/search' || type === wanted;
}

function Avatar({ profile, className = 'w-8 h-8' }) {
  return (
    <span
      className={`${className} rounded-md flex items-center justify-center text-sm font-semibold overflow-hidden ring-1 ring-white/15`}
      style={{ backgroundColor: profile?.avatarColor || '#7C5CFF' }}
    >
      {profile?.avatarPath ? (
        <img src={api.avatarUrl(profile.id, profile.avatarPath)} alt="" className="w-full h-full object-cover" />
      ) : (
        profile?.name?.[0]?.toUpperCase() || '?'
      )}
    </span>
  );
}

function ProfileMenu() {
  const { profile, switchProfile } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Profile menu"
        aria-expanded={open}
        className="flex items-center gap-1.5 p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <Avatar profile={profile} />
        <ChevronDown
          className={`hidden md:block w-4 h-4 text-white/70 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="absolute right-0 mt-2 w-56 glass rounded-xl ring-1 ring-white/10 shadow-card overflow-hidden origin-top-right"
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Avatar profile={profile} className="w-9 h-9" />
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.name}</p>
                <p className="text-xs text-white/50">Watching now</p>
              </div>
            </div>
            <MenuItem icon={Settings} label="Settings" onClick={() => go('/settings')} />
            <MenuItem icon={Users} label="Friends" onClick={() => go('/friends')} />
            <MenuItem
              icon={Repeat}
              label="Switch profile"
              onClick={() => {
                setOpen(false);
                switchProfile();
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-white/80 hover:text-white hover:bg-white/5 transition-colors"
    >
      <Icon className="w-4 h-4" /> {label}
    </button>
  );
}

function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.body.classList.add('has-tabbar');
    return () => document.body.classList.remove('has-tabbar');
  }, []);

  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-white/10"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-5" style={{ height: 'var(--tabbar-h)' }}>
        {TABS.map(({ label, to, icon: Icon, primary }) => {
          const active = isActive(location, to);
          return (
            <button
              key={to}
              onClick={() => navigate(to)}
              aria-label={label}
              aria-current={active ? 'page' : undefined}
              className="flex flex-col items-center justify-center gap-1 text-[10px] font-medium"
            >
              {/* Fixed-height icon slot keeps every label on one baseline. */}
              <span className="h-7 flex items-center justify-center">
                {primary ? (
                  <span className="w-10 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-accent to-accent-glow shadow-glow">
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </span>
                ) : (
                  <Icon
                    className={`w-[22px] h-[22px] transition-colors ${active ? 'text-white' : 'text-white/50'}`}
                    strokeWidth={active ? 2.4 : 2}
                  />
                )}
              </span>
              <span className={active ? 'text-white' : 'text-white/50'}>{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const location = useLocation();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-40 safe-top transition-[background-color,backdrop-filter] duration-500 ${
          scrolled ? 'glass' : 'bg-gradient-to-b from-black/70 via-black/30 to-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-4 md:px-12 h-14 md:h-[68px]">
          <div className="flex items-center gap-10">
            <Link to="/" aria-label="FamilyStream home" className="focus:outline-none">
              <Logo markClassName="w-7 h-7 md:w-8 md:h-8" wordmarkClassName="text-lg md:text-xl" />
            </Link>
            <nav aria-label="Sections" className="hidden md:flex items-center gap-6 text-sm">
              {LINKS.map(({ label, to }) => {
                const active = isActive(location, to);
                return (
                  <Link
                    key={to}
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`relative py-1 transition-colors ${
                      active ? 'text-white font-semibold' : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {label}
                    {active && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-accent"
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <button
              aria-label="Search"
              onClick={() => navigate('/search')}
              className="hidden md:flex p-2 rounded-full text-white/90 hover:bg-white/10 transition-colors"
            >
              <Search className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="hidden md:flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 ring-1 ring-white/10 transition-colors"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} /> Upload
            </button>
            <NotificationBell />
            <ProfileMenu />
          </div>
        </div>
      </header>
      <BottomTabBar />
    </>
  );
}
