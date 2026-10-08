import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { api } from '../lib/api';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#7C5CFF', '#FF3D8B', '#2D9CDB', '#00A676', '#F59E0B', '#EF4444'];

export default function ProfileSelect() {
  const [profiles, setProfiles] = useState([]);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [pinPrompt, setPinPrompt] = useState(null); // profile awaiting PIN
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const { chooseProfile } = useAuth();
  const navigate = useNavigate();

  const load = () => api.listProfiles().then(setProfiles);
  useEffect(() => { load(); }, []);

  const select = async (profile) => {
    if (profile.hasPin) {
      setPinPrompt(profile);
      return;
    }
    await chooseProfile(profile.id);
    navigate('/');
  };

  const confirmPin = async () => {
    try {
      await chooseProfile(pinPrompt.id, pin);
      navigate('/');
    } catch (err) {
      setError('Incorrect PIN.');
    }
  };

  const createProfile = async () => {
    if (!newName.trim()) return;
    const color = COLORS[profiles.length % COLORS.length];
    await api.createProfile({ name: newName.trim(), avatarColor: color });
    setNewName('');
    setCreating(false);
    load();
  };

  if (pinPrompt) {
    return (
      <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center px-4">
        <div
          className="w-24 h-24 rounded-xl flex items-center justify-center text-3xl font-bold mb-6 overflow-hidden"
          style={{ backgroundColor: pinPrompt.avatarColor }}
        >
          {pinPrompt.avatarPath ? (
            <img src={api.avatarUrl(pinPrompt.id, pinPrompt.avatarPath)} alt="" className="w-full h-full object-cover" />
          ) : (
            pinPrompt.name[0].toUpperCase()
          )}
        </div>
        <h2 className="text-xl font-semibold mb-4">Enter PIN for {pinPrompt.name}</h2>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="bg-base-800 rounded-md px-4 py-3 text-center text-lg tracking-[0.5em] w-40 outline-none ring-1 ring-white/10 focus:ring-accent"
        />
        {error && <p className="text-accent text-sm mt-2">{error}</p>}
        <div className="flex gap-3 mt-6">
          <button onClick={() => { setPinPrompt(null); setPin(''); setError(''); }} className="px-5 py-2 rounded-md ring-1 ring-white/20 hover:bg-white/10">
            Cancel
          </button>
          <button onClick={confirmPin} className="px-5 py-2 rounded-md bg-accent hover:bg-accent-dim font-semibold">
            Continue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center px-4 pt-28 pb-16 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(var(--accent-rgb)/0.14),transparent_60%)]" />
      <div className="absolute top-0 inset-x-0 safe-top px-4 md:px-12 h-16 md:h-20 flex items-center">
        <Logo markClassName="w-8 h-8" wordmarkClassName="text-xl" />
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative font-display text-3xl md:text-5xl font-bold tracking-tight mb-10 md:mb-14"
      >
        Who's watching?
      </motion.h1>

      <div className="relative flex flex-wrap gap-5 md:gap-8 justify-center max-w-3xl">
        {profiles.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            whileHover={{ scale: 1.06 }}
            onClick={() => select(p)}
            className="flex flex-col items-center gap-3 group"
          >
            <div
              className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center text-5xl font-display font-bold relative ring-[3px] ring-transparent group-hover:ring-white group-focus-visible:ring-white shadow-card transition-all duration-300 overflow-hidden"
              style={{ backgroundColor: p.avatarColor }}
            >
              {p.avatarPath ? (
                <img src={api.avatarUrl(p.id, p.avatarPath)} alt="" className="w-full h-full object-cover" />
              ) : (
                p.name[0].toUpperCase()
              )}
              {/* Soft top-left sheen so flat color avatars feel lit, not painted */}
              <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-br from-white/25 via-transparent to-black/25" />
              {p.hasPin && <Lock className="w-5 h-5 absolute bottom-2 right-2 opacity-80" />}
            </div>
            <span className="text-white/60 group-hover:text-white transition-colors text-sm md:text-base font-medium">{p.name}</span>
          </motion.button>
        ))}

        <motion.button
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: profiles.length * 0.06 }}
          whileHover={{ scale: 1.06 }}
          onClick={() => setCreating(true)}
          className="flex flex-col items-center gap-3 group"
        >
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl flex items-center justify-center bg-white/[0.04] ring-1 ring-white/15 border border-dashed border-white/10 group-hover:bg-white/[0.08] group-hover:ring-white/40 transition-all duration-300">
            <Plus className="w-10 h-10 text-white/50" />
          </div>
          <span className="text-white/50 group-hover:text-white transition-colors text-sm md:text-base font-medium">Add Profile</span>
        </motion.button>
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        >
          <div className="glass rounded-2xl p-6 w-full max-w-sm ring-1 ring-white/10 shadow-card">
            <h3 className="font-semibold mb-4">New profile name</h3>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Mom, Dad, Kids"
              className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button onClick={() => setCreating(false)} className="px-4 py-2 rounded-md hover:bg-white/10">Cancel</button>
              <button onClick={createProfile} className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dim font-semibold">Create</button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
