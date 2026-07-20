import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Camera, Loader2, AtSign, Phone } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { useTheme } from '../context/ThemeContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../lib/api';

function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Settings() {
  const { themeId, setTheme, themes } = useTheme();
  const { profile, updateProfile } = useAuth();

  const [name, setName] = useState(profile?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [currentUsername, setCurrentUsername] = useState(null);
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState('');
  const [usernameSaved, setUsernameSaved] = useState(false);

  const [phone, setPhone] = useState('');
  const [currentPhone, setCurrentPhone] = useState(null);
  const [savingPhone, setSavingPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneSaved, setPhoneSaved] = useState(false);

  const [usage, setUsage] = useState(null);

  useEffect(() => {
    api.me().then((me) => {
      setCurrentUsername(me.username);
      setUsername(me.username || '');
      setCurrentPhone(me.phone);
      setPhone(me.phone || '');
    });
    api.storageUsage().then(setUsage);
  }, []);

  const saveUsername = async (e) => {
    e.preventDefault();
    const trimmed = username.trim().toLowerCase();
    if (!trimmed || trimmed === currentUsername) return;
    setSavingUsername(true);
    setUsernameError('');
    setUsernameSaved(false);
    try {
      const updated = await api.setUsername(trimmed);
      setCurrentUsername(updated.username);
      setUsername(updated.username);
      setUsernameSaved(true);
    } catch (err) {
      setUsernameError(err.message);
    } finally {
      setSavingUsername(false);
    }
  };

  const savePhone = async (e) => {
    e.preventDefault();
    if (!phone.trim() || phone.trim() === currentPhone) return;
    setSavingPhone(true);
    setPhoneError('');
    setPhoneSaved(false);
    try {
      const updated = await api.setPhone(phone.trim());
      setCurrentPhone(updated.phone);
      setPhone(updated.phone);
      setPhoneSaved(true);
    } catch (err) {
      setPhoneError(err.message);
    } finally {
      setSavingPhone(false);
    }
  };

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

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">Account</h2>
        <form onSubmit={saveUsername} className="mb-2">
          <label className="block text-xs text-white/50 mb-1.5">
            Username — lets friends add you without knowing your email
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-base-800 rounded-md ring-1 ring-white/10 focus-within:ring-accent">
              <AtSign className="w-4 h-4 text-white/40 ml-3" />
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value.toLowerCase()); setUsernameSaved(false); }}
                placeholder="username"
                maxLength={20}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingUsername || !username.trim() || username.trim() === currentUsername}
              className="bg-accent hover:bg-accent-dim transition-colors rounded-md px-4 text-sm font-semibold disabled:opacity-40"
            >
              {savingUsername ? <Loader2 className="w-4 h-4 animate-spin" /> : usernameSaved ? <Check className="w-4 h-4" /> : 'Save'}
            </button>
          </div>
          {usernameError && <p className="text-accent text-sm mt-2">{usernameError}</p>}
        </form>

        <form onSubmit={savePhone} className="mb-2 mt-4">
          <label className="block text-xs text-white/50 mb-1.5">
            Phone — another way for friends to find you (not verified — just a lookup convenience)
          </label>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-base-800 rounded-md ring-1 ring-white/10 focus-within:ring-accent">
              <Phone className="w-4 h-4 text-white/40 ml-3" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => { setPhone(e.target.value); setPhoneSaved(false); }}
                placeholder="(555) 123-4567"
                className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={savingPhone || !phone.trim() || phone.trim() === currentPhone}
              className="bg-accent hover:bg-accent-dim transition-colors rounded-md px-4 text-sm font-semibold disabled:opacity-40"
            >
              {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : phoneSaved ? <Check className="w-4 h-4" /> : 'Save'}
            </button>
          </div>
          {phoneError && <p className="text-accent text-sm mt-2">{phoneError}</p>}
        </form>

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 mt-10">Profile</h2>
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

        <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 mt-10">Storage</h2>
        {!usage ? (
          <Loader2 className="w-4 h-4 animate-spin text-white/40" />
        ) : (
          <div className="bg-base-800 rounded-xl p-4 ring-1 ring-white/10">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-white/70">Your uploads</p>
              <p className="text-sm font-semibold">{formatBytes(usage.totalBytes)}</p>
            </div>
            {usage.totalBytes > 0 && (
              <div className="h-2 rounded-full bg-base-700 overflow-hidden flex mb-2">
                <div className="h-full bg-accent" style={{ width: `${(usage.videoBytes / usage.totalBytes) * 100}%` }} />
                <div className="h-full bg-accent-glow" style={{ width: `${(usage.photoBytes / usage.totalBytes) * 100}%` }} />
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent shrink-0" /> Videos — {formatBytes(usage.videoBytes)}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-glow shrink-0" /> Photos — {formatBytes(usage.photoBytes)}
              </span>
            </div>
            <p className="text-xs text-white/40">{usage.itemCount} {usage.itemCount === 1 ? 'item' : 'items'}</p>

            {usage.disk && (
              <div className="border-t border-white/10 mt-3 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-white/50">Server disk</p>
                  <p className="text-xs text-white/50">
                    {formatBytes(usage.disk.totalBytes - usage.disk.freeBytes)} of {formatBytes(usage.disk.totalBytes)} used
                  </p>
                </div>
                <div className="h-1.5 rounded-full bg-base-700 overflow-hidden">
                  <div
                    className="h-full bg-white/40"
                    style={{ width: `${((usage.disk.totalBytes - usage.disk.freeBytes) / usage.disk.totalBytes) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

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
