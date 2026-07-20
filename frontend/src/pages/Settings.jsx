import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api';

export default function Settings() {
  const { themeId, setTheme, themes } = useTheme();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim() || name === profile?.name) return;
    setSavingName(true);
    setError('');
    try {
      const updated = await api.renameProfile(profile.id, name.trim());
      updateProfile({ name: updated.name });
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingName(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setError('');
    try {
      const updated = await api.uploadAvatar(profile.id, file);
      updateProfile({ avatarPath: updated.avatarPath });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploadingAvatar(false);
      e.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 md:px-10 max-w-2xl">
        <h1 className="font-display text-3xl tracking-wide mb-1">Settings</h1>
        <p className="text-white/50 text-sm mb-8">Manage this profile and how the app looks for it.</p>

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Profile</h2>
        <div className="flex items-center gap-5 mb-4">
          <label className="relative group cursor-pointer shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-semibold ring-1 ring-white/20 overflow-hidden"
              style={{ backgroundColor: profile?.avatarColor || '#6366F1' }}
            >
              {profile?.avatarPath ? (
                <img src={api.avatarUrl(profile.id, profile.avatarPath)} alt="" className="w-full h-full object-cover" />
              ) : (
                profile?.name?.[0]?.toUpperCase() || '?'
              )}
            </div>
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/50 flex items-center justify-center transition-colors">
              {uploadingAvatar ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
            <input type="file" accept="image/*" onChange={onAvatarChange} className="hidden" disabled={uploadingAvatar} />
          </label>

          <form onSubmit={saveName} className="flex-1 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Profile name"
              className="flex-1 bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
            />
            <button
              type="submit"
              disabled={savingName || !name.trim() || name === profile?.name}
              className="bg-accent hover:bg-accent-dim transition-colors rounded-md px-4 text-sm font-semibold disabled:opacity-40"
            >
              {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </form>
        </div>
        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 mt-10">Appearance</h2>
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
