import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { Search, UploadCloud, Clapperboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { scrollY } = useScroll();
  const { profile, switchProfile } = useAuth();
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, 'change', (y) => setScrolled(y > 24));

  return (
    <motion.header
      className={`fixed top-0 inset-x-0 z-40 safe-top transition-colors duration-300 ${
        scrolled ? 'bg-base-950/95 backdrop-blur-md shadow-lg' : 'bg-gradient-to-b from-black/80 to-transparent'
      }`}
    >
      <div className="flex items-center justify-between px-4 md:px-10 py-3">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 text-accent font-display text-2xl tracking-wide">
            <Clapperboard className="w-6 h-6" strokeWidth={2.5} />
            FamilyStream
          </Link>
          <nav className="hidden md:flex gap-6 text-sm text-white/80 font-medium">
            <Link to="/" className="hover:text-white transition-colors">Home</Link>
            <Link to="/search" className="hover:text-white transition-colors">Browse</Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            aria-label="Search"
            onClick={() => navigate('/search')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            aria-label="Upload media"
            onClick={() => navigate('/upload')}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <UploadCloud className="w-5 h-5" />
          </button>
          <button
            onClick={switchProfile}
            className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold ring-1 ring-white/20"
            style={{ backgroundColor: profile?.avatarColor || '#E50914' }}
            aria-label="Switch profile"
          >
            {profile?.name?.[0]?.toUpperCase() || '?'}
          </button>
        </div>
      </div>
    </motion.header>
  );
}
