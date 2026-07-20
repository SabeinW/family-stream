import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function Settings() {
  const { themeId, setTheme, themes } = useTheme();
  const { profile } = useAuth();

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 md:px-10 max-w-2xl">
        <h1 className="font-display text-3xl tracking-wide mb-1">Settings</h1>
        <p className="text-white/50 text-sm mb-8">
          Color theme for {profile?.name || 'this profile'} — only affects this profile on this device.
        </p>

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Appearance</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {themes.map((t) => {
            const active = t.id === themeId;
            return (
              <motion.button
                key={t.id}
                onClick={() => setTheme(t.id)}
                whileTap={{ scale: 0.97 }}
                className={`relative rounded-xl p-4 bg-base-800 ring-1 text-left transition-colors ${
                  active ? 'ring-2' : 'ring-white/10 hover:ring-white/20'
                }`}
                style={active ? { boxShadow: `0 0 0 2px rgb(${t.accent})` } : undefined}
              >
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className="w-8 h-8 rounded-full bg-gradient-to-br shrink-0"
                    style={{ backgroundImage: `linear-gradient(135deg, rgb(${t.accent}), rgb(${t.glow}))` }}
                  />
                  <span className="font-medium">{t.name}</span>
                  {active && <Check className="w-4 h-4 ml-auto text-white" />}
                </div>
                <div className="h-2 rounded-full" style={{ backgroundColor: `rgb(${t.dim})` }} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
