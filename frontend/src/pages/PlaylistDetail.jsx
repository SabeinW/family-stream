import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, X, Trash2, Loader2, Check, Search as SearchIcon, Pencil, UploadCloud, Library, Play } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import MediaCard from '../components/MediaCard.jsx';
import Slideshow from '../components/Slideshow.jsx';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext.jsx';
import { THEMES } from '../lib/themes.js';

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Private — only me' },
  { id: 'friends', label: 'All friends' },
  { id: 'custom', label: 'Specific friends' },
];

function LibraryTab({ playlistId, existingIds, onAdded }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [addingId, setAddingId] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => {
      api.listMedia(query ? { search: query } : {}).then(setResults);
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  const add = async (mediaId) => {
    setAddingId(mediaId);
    try {
      await api.addPlaylistItem(playlistId, mediaId);
      onAdded();
    } finally {
      setAddingId(null);
    }
  };

  return (
    <>
      <div className="relative mb-4">
        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your library…"
          className="w-full bg-base-800 rounded-md pl-9 pr-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
        />
      </div>
      <div className="overflow-y-auto scrollbar-hidden grid grid-cols-3 sm:grid-cols-4 gap-3">
        {results.map((m) => {
          const already = existingIds.includes(m.id);
          return (
            <button
              key={m.id}
              onClick={() => !already && add(m.id)}
              disabled={already || addingId === m.id}
              className="text-left relative rounded-lg overflow-hidden aspect-video bg-base-800 group"
            >
              {m.thumbnailPath && <img src={api.thumbnailUrl(m.id)} alt="" className="w-full h-full object-cover" />}
              <div
                className={`absolute inset-0 flex items-center justify-center transition-colors ${
                  already ? 'bg-black/60' : 'bg-black/0 group-hover:bg-black/50'
                }`}
              >
                {addingId === m.id ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : already ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Plus className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                )}
              </div>
              <p className="absolute bottom-1 left-1.5 right-1.5 text-[11px] truncate">{m.title}</p>
            </button>
          );
        })}
        {results.length === 0 && <p className="text-white/40 text-sm col-span-full py-8 text-center">No matches.</p>}
      </div>
    </>
  );
}

function UploadTab({ playlistId, onAdded }) {
  const [files, setFiles] = useState([]); // [{ file, status: 'pending'|'uploading'|'done'|'error' }]
  const [title, setTitle] = useState('');
  const [visibility, setVisibility] = useState('private');
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (fileList) => setFiles((prev) => [...prev, ...[...fileList].map((file) => ({ file, status: 'pending' }))]);
  const removeFile = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  const submit = async (e) => {
    e.preventDefault();
    if (!files.length || submitting) return;
    setSubmitting(true);

    for (let i = 0; i < files.length; i++) {
      setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'uploading' } : f)));
      const { file } = files[i];
      const form = new FormData();
      form.append('file', file);
      form.append('title', files.length === 1 && title ? title : file.name);
      form.append('visibility', visibility);
      try {
        const { media } = await api.upload(form);
        await api.addPlaylistItem(playlistId, media.id);
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'done' } : f)));
      } catch (err) {
        setFiles((prev) => prev.map((f, idx) => (idx === i ? { ...f, status: 'error', error: err.message } : f)));
      }
    }
    setSubmitting(false);
    onAdded();
  };

  const allDone = files.length > 0 && files.every((f) => f.status === 'done');

  return (
    <form onSubmit={submit} className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
        }}
        className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? 'border-accent bg-accent/5' : 'border-white/20'
        }`}
      >
        <UploadCloud className="w-8 h-8 mx-auto mb-2 text-white/50" />
        <p className="text-white/70 mb-2 text-sm">
          {files.length ? `${files.length} file${files.length === 1 ? '' : 's'} selected` : 'Drag & drop photos or videos, or browse'}
        </p>
        <input
          type="file"
          accept="video/*,image/*"
          multiple
          onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
          id="playlist-upload-input"
        />
        <label htmlFor="playlist-upload-input" className="inline-block text-accent hover:underline cursor-pointer text-sm">
          Choose files
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-hidden">
          {files.map((f, i) => (
            <div key={i} className="flex items-center justify-between bg-base-800 rounded-md px-3 py-2 text-sm">
              <span className="truncate flex-1 mr-2">{f.file.name}</span>
              {f.status === 'pending' && (
                <button type="button" onClick={() => removeFile(i)} aria-label="Remove" className="p-0.5 hover:text-accent">
                  <X className="w-4 h-4" />
                </button>
              )}
              {f.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-white/50" />}
              {f.status === 'done' && <Check className="w-4 h-4 text-accent" />}
              {f.status === 'error' && <span className="text-accent text-xs">{f.error || 'Failed'}</span>}
            </div>
          ))}
        </div>
      )}

      {files.length === 1 && (
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
        />
      )}
      <select
        value={visibility}
        onChange={(e) => setVisibility(e.target.value)}
        className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
      >
        <option value="private">Private — only me</option>
        <option value="friends">Shared with friends</option>
      </select>

      <button
        type="submit"
        disabled={!files.length || submitting || allDone}
        className="w-full flex items-center justify-center gap-2 bg-accent hover:bg-accent-dim transition-colors rounded-md py-2.5 text-sm font-semibold disabled:opacity-50"
      >
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        {submitting ? 'Uploading…' : allDone ? 'Added!' : 'Upload & add to playlist'}
      </button>
      {allDone && (
        <p className="text-white/50 text-xs text-center">
          Videos finish processing in the background and will appear once ready.
        </p>
      )}
    </form>
  );
}

function AddMediaModal({ playlistId, existingIds, onClose, onAdded }) {
  const [tab, setTab] = useState('library');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={onClose}
    >
      <div
        className="bg-base-900 rounded-xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Add media</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex gap-1 bg-base-800 rounded-lg p-1 mb-4 w-fit">
          <button
            onClick={() => setTab('library')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'library' ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <Library className="w-3.5 h-3.5" /> From library
          </button>
          <button
            onClick={() => setTab('upload')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === 'upload' ? 'bg-accent text-white' : 'text-white/60 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload new
          </button>
        </div>

        <div className="overflow-y-auto scrollbar-hidden">
          {tab === 'library' ? (
            <LibraryTab playlistId={playlistId} existingIds={existingIds} onAdded={onAdded} />
          ) : (
            <UploadTab playlistId={playlistId} onAdded={onAdded} />
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [playlist, setPlaylist] = useState(null);
  const [friends, setFriends] = useState([]);
  const [editing, setEditing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [slideshowIndex, setSlideshowIndex] = useState(null);
  const [name, setName] = useState('');
  const [colorId, setColorId] = useState(THEMES[0].id);
  const [visibility, setVisibility] = useState('private');
  const [shareWith, setShareWith] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState(null);

  const load = useCallback(() => api.getPlaylist(id).then(setPlaylist), [id]);
  useEffect(() => { load(); }, [load]);

  const isOwner = playlist && playlist.ownerId === user?.id;

  const startEditing = () => {
    setName(playlist.name);
    setColorId(THEMES.find((t) => t.accent === playlist.coverColor)?.id || THEMES[0].id);
    setVisibility(playlist.visibility);
    setShareWith((playlist.shares || []).map((s) => s.userId));
    setError('');
    setEditing(true);
    if (friends.length === 0) api.listFriends().then((d) => setFriends(d.friends));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const color = THEMES.find((t) => t.id === colorId)?.accent;
      await api.updatePlaylist(id, {
        name: name.trim(),
        coverColor: color,
        visibility,
        shareWith: visibility === 'custom' ? shareWith : undefined,
      });
      setEditing(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (mediaId) => {
    setRemovingId(mediaId);
    try {
      await api.removePlaylistItem(id, mediaId);
      load();
    } finally {
      setRemovingId(null);
    }
  };

  const deletePlaylist = async () => {
    await api.deletePlaylist(id);
    navigate('/playlists');
  };

  const toggleFriend = (userId) => {
    setShareWith((prev) => (prev.includes(userId) ? prev.filter((i) => i !== userId) : [...prev, userId]));
  };

  if (!playlist) {
    return (
      <div className="min-h-screen bg-base-950 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-950 pb-20">
      <Navbar />
      <div
        className="pt-28 pb-10 px-4 md:px-10"
        style={{ backgroundImage: `linear-gradient(180deg, rgb(${playlist.coverColor} / 0.25), transparent 70%)` }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display text-3xl md:text-4xl tracking-wide mb-1">{playlist.name}</h1>
            <p className="text-white/50 text-sm">
              {playlist.items.length} {playlist.items.length === 1 ? 'item' : 'items'}
              {playlist.hiddenCount > 0 && ` · ${playlist.hiddenCount} not visible to you`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {playlist.items.length > 0 && (
              <button
                onClick={() => setSlideshowIndex(0)}
                className="flex items-center gap-2 bg-white text-black hover:bg-white/85 transition-colors rounded-md px-4 py-2 text-sm font-semibold"
              >
                <Play className="w-4 h-4 fill-black" /> Slideshow
              </button>
            )}
            {isOwner && (
              <>
                <button
                  onClick={() => setShowAdd(true)}
                  className="flex items-center gap-2 bg-accent hover:bg-accent-dim transition-colors rounded-md px-4 py-2 text-sm font-semibold"
                >
                  <Plus className="w-4 h-4" /> Add media
                </button>
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-md px-4 py-2 text-sm font-semibold"
                >
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 md:px-10">
        {playlist.items.length === 0 ? (
          <p className="text-white/40 text-sm">
            {isOwner ? 'No items yet — click "Add media" to get started.' : 'Nothing to show here yet.'}
          </p>
        ) : (
          <div className="flex flex-wrap gap-4">
            {playlist.items.map((m) => (
              <div key={m.id} className="relative group">
                <MediaCard media={m} />
                {isOwner && (
                  <button
                    onClick={() => removeItem(m.id)}
                    disabled={removingId === m.id}
                    aria-label="Remove from playlist"
                    className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-black/60 opacity-0 group-hover:opacity-100 hover:bg-black/80 transition-opacity disabled:opacity-100"
                  >
                    {removingId === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {slideshowIndex !== null && (
          <Slideshow items={playlist.items} startIndex={slideshowIndex} onClose={() => setSlideshowIndex(null)} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAdd && (
          <AddMediaModal
            playlistId={id}
            existingIds={playlist.items.map((m) => m.id)}
            onClose={() => setShowAdd(false)}
            onAdded={load}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
            onClick={() => setEditing(false)}
          >
            <div
              className="bg-base-900 rounded-xl p-6 w-full max-w-md max-h-[85vh] overflow-y-auto scrollbar-hidden ring-1 ring-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold mb-4">Edit playlist</h3>

              <label className="block text-xs text-white/50 mb-1.5">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-4"
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

              <p className="text-xs text-white/50 mb-2">Sharing</p>
              <div className="flex flex-col gap-2 mb-3">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="playlist-visibility"
                      checked={visibility === opt.id}
                      onChange={() => setVisibility(opt.id)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
              {visibility === 'custom' && (
                <div className="max-h-32 overflow-y-auto scrollbar-hidden space-y-1.5 mb-4 pl-1">
                  {friends.length === 0 ? (
                    <p className="text-white/40 text-xs">No friends yet.</p>
                  ) : (
                    friends.map((f) => (
                      <label key={f.userId} className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={shareWith.includes(f.userId)} onChange={() => toggleFriend(f.userId)} />
                        {f.username ? `@${f.username}` : f.email}
                      </label>
                    ))
                  )}
                </div>
              )}

              {error && <p className="text-accent text-sm mb-3">{error}</p>}

              <div className="flex items-center justify-between mt-6">
                <button onClick={deletePlaylist} className="text-xs text-white/50 hover:text-accent transition-colors flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" /> Delete playlist
                </button>
                <div className="flex gap-3">
                  <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-md hover:bg-white/10 text-sm">
                    Cancel
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !name.trim()}
                    className="px-4 py-2 rounded-md bg-accent hover:bg-accent-dim font-semibold text-sm disabled:opacity-40"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
