import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { api } from '../lib/api';

const VISIBILITY_OPTIONS = [
  { id: 'private', label: 'Private — only me' },
  { id: 'friends', label: 'All friends' },
  { id: 'custom', label: 'Specific friends' },
];

// Owner-only visibility/sharing editor for a single media item. Fetches
// its own data (full media + friends list) rather than taking it as props,
// so it can be dropped into any owner-facing surface (Dashboard spotlight
// Details modal, the Watch page, wherever) without that surface needing to
// know anything about sharing.
export default function ShareControl({ mediaId, isOwner }) {
  const [loaded, setLoaded] = useState(false);
  const [visibility, setVisibility] = useState('private');
  const [shareWith, setShareWith] = useState([]);
  const [friends, setFriends] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOwner) return;
    Promise.all([api.getMedia(mediaId), api.listFriends()]).then(([full, friendData]) => {
      setVisibility(full.visibility);
      setShareWith((full.shares || []).map((s) => s.userId));
      setFriends(friendData.friends);
      setLoaded(true);
    });
  }, [mediaId, isOwner]);

  if (!isOwner) return null;
  if (!loaded) return <Loader2 className="w-4 h-4 animate-spin text-white/40 mt-4" />;

  const toggleFriend = (userId) => {
    setShareWith((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));
  };

  const save = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await api.updateVisibility(mediaId, { visibility, shareWith: visibility === 'custom' ? shareWith : undefined });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Sharing</h3>
      <div className="flex flex-col gap-2 mb-3">
        {VISIBILITY_OPTIONS.map((opt) => (
          <label key={opt.id} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name={`visibility-${mediaId}`}
              checked={visibility === opt.id}
              onChange={() => { setVisibility(opt.id); setSaved(false); }}
              className="accent-current text-accent"
            />
            {opt.label}
          </label>
        ))}
      </div>

      {visibility === 'custom' && (
        <div className="max-h-32 overflow-y-auto scrollbar-hidden space-y-1.5 mb-3 pl-1">
          {friends.length === 0 ? (
            <p className="text-white/40 text-xs">No friends yet — add some from the Friends page.</p>
          ) : (
            friends.map((f) => (
              <label key={f.userId} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={shareWith.includes(f.userId)}
                  onChange={() => { toggleFriend(f.userId); setSaved(false); }}
                />
                {f.username ? `@${f.username}` : f.email}
              </label>
            ))
          )}
        </div>
      )}

      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide bg-white/10 hover:bg-white/20 px-3 py-2 rounded-full transition-colors disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : null}
        {saved ? 'Saved' : 'Save sharing'}
      </button>
      {error && <p className="text-accent text-xs mt-2">{error}</p>}
    </div>
  );
}
