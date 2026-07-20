import React, { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { api } from '../lib/api';

// Two-tap confirm (no native confirm() dialog, matches the rest of the
// app's inline-UI patterns) — first tap reveals a Yes/Cancel, second tap
// on "Yes" actually deletes.
export default function DeleteMediaButton({ mediaId, onDeleted, className = '' }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const doDelete = async () => {
    setDeleting(true);
    setError('');
    try {
      await api.deleteMedia(mediaId);
      onDeleted();
    } catch (err) {
      setError(err.message);
      setDeleting(false);
    }
  };

  if (confirming) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-xs text-white/70 whitespace-nowrap">Delete permanently?</span>
        <button
          onClick={doDelete}
          disabled={deleting}
          className="text-xs font-semibold text-accent hover:underline disabled:opacity-50 whitespace-nowrap"
        >
          {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Yes, delete'}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-white/40 hover:text-white whitespace-nowrap">
          Cancel
        </button>
        {error && <span className="text-accent text-xs whitespace-nowrap">{error}</span>}
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      aria-label="Delete"
      className={`p-2 rounded-full hover:bg-white/10 transition-colors ${className}`}
    >
      <Trash2 className="w-5 h-5" />
    </button>
  );
}
