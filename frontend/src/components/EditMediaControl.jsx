import React, { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import { api } from '../lib/api';

function toDateInputValue(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toISOString().slice(0, 10);
}

// Owner-only editor for a media item's title/description/category/tags/date.
// Takes the full media object as a prop (the caller already has it — no
// need to re-fetch, unlike ShareControl which needs a fresh visibility read).
export default function EditMediaControl({ media, onSaved }) {
  const [title, setTitle] = useState(media.title || '');
  const [description, setDescription] = useState(media.description || '');
  const [category, setCategory] = useState(media.category || '');
  const [tags, setTags] = useState(media.tags || '');
  const [takenAt, setTakenAt] = useState(toDateInputValue(media.takenAt));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api.updateMedia(media.id, {
        title: title.trim(),
        description,
        category,
        tags,
        takenAt: takenAt || null,
      });
      setSaved(true);
      onSaved?.(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save}>
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Edit details</h3>

      <label className="block text-xs text-white/50 mb-1.5">Title</label>
      <input
        value={title}
        onChange={(e) => { setTitle(e.target.value); setSaved(false); }}
        className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-3"
      />

      <label className="block text-xs text-white/50 mb-1.5">Description</label>
      <textarea
        value={description}
        onChange={(e) => { setDescription(e.target.value); setSaved(false); }}
        rows={3}
        className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-3 resize-none"
      />

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Category</label>
          <input
            value={category}
            onChange={(e) => { setCategory(e.target.value); setSaved(false); }}
            placeholder="e.g. Vacations"
            className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Date taken</label>
          <input
            type="date"
            value={takenAt}
            onChange={(e) => { setTakenAt(e.target.value); setSaved(false); }}
            className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
        </div>
      </div>

      <label className="block text-xs text-white/50 mb-1.5">Tags, comma-separated</label>
      <input
        value={tags}
        onChange={(e) => { setTags(e.target.value); setSaved(false); }}
        className="w-full bg-base-800 rounded-md px-4 py-2.5 text-sm outline-none ring-1 ring-white/10 focus:ring-accent mb-4"
      />

      <button
        type="submit"
        disabled={saving || !title.trim()}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
        {saved ? 'Saved' : 'Save changes'}
      </button>
      {error && <p className="text-accent text-xs mt-2">{error}</p>}
    </form>
  );
}
