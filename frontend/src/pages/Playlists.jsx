import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, ListVideo, Trash2, Loader2, Users, Lock } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { THEMES } from '../lib/themes.js';

function Cover({ coverColor, thumbnails }) {
  const cells = [...thumbnails, null, null, null].slice(0, 4);
  return (
    <div
      className="aspect-video rounded-lg overflow-hidden relative grid grid-cols-2 grid-rows-2 gap-px"
      style={{ backgroundImage: `linear-gradient(135deg, rgb(${coverColor}), rgb(${coverColor} / 0.4))` }}
    >
      {cells.map((c, i) =>
        c ? (
          <img key={c.mediaId} src={api.thumbnailUrl(c.mediaId)} alt="" className="w-full h-full object-cover" />
        ) : (
          <div key={i} />
        )
      )}
      {thumbnails.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ListVideo className="w-8 h-8 text-white/50" />
        </div>
      )}
    </div>
  );
}

export default function Playlists() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(THEMES[0].id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.listPlaylists().then(setPlaylists);
  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError('');
    try {
      const color = THEMES.find((t) => t.id === colorId)?.accent;
      const playlist = await api.createPlaylist({ name: name.trim(), coverColor: color });
      setCreating(false);
      setName('');
      navigate(`/playlists/${playlist.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (e, id) => {
    e.stopPropagation();
    setBusyId(id);
    try {
      await api.deletePlaylist(id);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div className="pt-28 px-4 md:px-10">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-display text-3xl tracking-wide">Playlists</h1>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => setCreating(true)}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dim transition-colors rounded-md px-4 py-2 text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> New Playlist
          </motion.button>
        </div>
        <p className="text-white/50 text-sm mb-8">Group memories together and share them as a set.</p>
        {error && <p className="text-accent text-sm mb-4">{error}</p>}

        {!playlists ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-white/40" />
          </div>
        ) : playlists.length === 0 ? (
          <p className="text-white/40 text-sm">No playlists yet — create one to get started.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {playlists.map((p) => (
              <motion.button
                key={p.id}
                whileHover={{ scale: 1.03 }}
                onClick={() => navigate(`/playlists/${p.id}`)}
                className="text-left group"
              >
                <div className="relative">
                  <Cover coverColor={p.coverColor} thumbnails={p.coverThumbnails} />
                  {p.ownerId === user?.id && (
                    <button
                      onClick={(e) => remove(e, p.id)}
                      disabled={busyId === p.id}
                      aria-label="Delete playlist"
                      className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity disabled:opacity-100"
                    >
                      {busyId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  {p.visibility !== 'private' && <Users className="w-3.5 h-3.5 text-white/40 shrink-0" />}
                  {p.visibility === 'private' && <Lock className="w-3 h-3 text-white/30 shrink-0" />}
                </div>
                <p className="text-xs text-white/40">{p.itemCount} {p.itemCount === 1 ? 'item' : 'items'}</p>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
          onClick={() => setCreating(false)}
        >
          <div className="bg-base-900 rounded-xl p-6 w-full max-w-sm ring-1 ring-white/10" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">New playlist</h3>
            <form onSubmit={create}>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Summer Vacation 2026"
                className="w-full bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-4"
              />
              <p className="text-xs text-white/50 mb-2">Cover color</p>
              <div className="flex flex-wrap gap-2 mb-5">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setColorId(t.id)}
                    aria-label={t.name}
                    className={`w-8 h-8 rounded-full transition-transform ${colorId === t.id ? 'scale-110 ring-2 ring-white' : 'hover:scale-105'}`}
                    style={{ backgroundColor: `rgb(${t.accent})` }}
                  />
                ))}
              </div>
              {error && <p className="text-accent text-sm mb-3">{error}</p>}
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setCreating(false)} className="px-4 py-2 rounded-md hover:bg-white/10">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dim font-semibold disabled:opacity-40"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
