import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Lock } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';

const COLORS = ['#6366F1', '#8B5CF6', '#1E88E5', '#00A676', '#F4A100'];

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
    <div className="min-h-screen bg-base-950 flex flex-col items-center justify-center px-4">
      <h1 className="text-3xl md:text-4xl font-semibold mb-10">Who's watching?</h1>

      <div className="flex flex-wrap gap-6 justify-center max-w-2xl">
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
              className="w-28 h-28 md:w-32 md:h-32 rounded-xl flex items-center justify-center text-4xl font-bold relative ring-2 ring-transparent group-hover:ring-white transition-all overflow-hidden"
              style={{ backgroundColor: p.avatarColor }}
            >
              {p.avatarPath ? (
                <img src={api.avatarUrl(p.id, p.avatarPath)} alt="" className="w-full h-full object-cover" />
              ) : (
                p.name[0].toUpperCase()
              )}
              {p.hasPin && <Lock className="w-5 h-5 absolute bottom-2 right-2 opacity-80" />}
            </div>
            <span className="text-white/70 group-hover:text-white transition-colors">{p.name}</span>
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
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl flex items-center justify-center bg-base-800 ring-2 ring-transparent group-hover:ring-white/40 transition-all">
            <Plus className="w-10 h-10 text-white/50" />
          </div>
          <span className="text-white/50 group-hover:text-white transition-colors">Add Profile</span>
        </motion.button>
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
        >
          <div className="bg-base-900 rounded-xl p-6 w-full max-w-sm ring-1 ring-white/10">
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
