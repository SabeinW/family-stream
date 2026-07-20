import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Check, X, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar.jsx';
import { api } from '../lib/api';

function Row({ userId, email, username, avatarColor, avatarPath, action }) {
  const label = username ? `@${username}` : email;
  return (
    <div className="flex items-center justify-between bg-base-800 rounded-lg px-4 py-3 ring-1 ring-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center font-semibold shrink-0 overflow-hidden"
          style={{ backgroundColor: avatarPath ? undefined : avatarColor || 'rgb(var(--accent-rgb) / 0.2)' }}
        >
          {avatarPath ? (
            <img src={api.friendAvatarUrl(userId, avatarPath)} alt="" className="w-full h-full object-cover" />
          ) : (
            (username || email)[0]?.toUpperCase()
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate">{label}</p>
          {username && <p className="text-xs text-white/40 truncate">{email}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">{action}</div>
    </div>
  );
}

export default function Friends() {
  const [data, setData] = useState({ friends: [], incoming: [], outgoing: [] });
  const [identifier, setIdentifier] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.listFriends().then(setData);
  useEffect(() => { load(); }, []);

  const sendRequest = async (e) => {
    e.preventDefault();
    if (!identifier.trim()) return;
    setSending(true);
    setError('');
    setNotice('');
    try {
      const res = await api.sendFriendRequest(identifier.trim());
      setNotice(res.status === 'accepted' ? `You and ${identifier.trim()} are now friends!` : 'Friend request sent.');
      setIdentifier('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const withBusy = async (id, fn) => {
    setBusyId(id);
    setError('');
    try {
      await fn();
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
      <div className="pt-28 px-4 md:px-10 max-w-2xl">
        <h1 className="font-display text-3xl tracking-wide mb-1">Friends</h1>
        <p className="text-white/50 text-sm mb-8">
          Add family and friends by email or @username — you'll be able to share media and playlists with them.
        </p>

        <form onSubmit={sendRequest} className="flex gap-2 mb-2">
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="their@email.com or @username"
            className="flex-1 bg-base-800 rounded-md px-4 py-3 text-sm outline-none ring-1 ring-white/10 focus:ring-accent"
          />
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={sending || !identifier.trim()}
            className="flex items-center gap-2 bg-accent hover:bg-accent-dim transition-colors rounded-md px-5 font-semibold disabled:opacity-40"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            Add
          </motion.button>
        </form>
        {error && <p className="text-accent text-sm mb-2">{error}</p>}
        {notice && <p className="text-white/60 text-sm mb-2">{notice}</p>}

        {data.incoming.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
              Requests ({data.incoming.length})
            </h2>
            <div className="space-y-2">
              {data.incoming.map((f) => (
                <Row
                  key={f.friendshipId}
                  userId={f.userId}
                  email={f.email}
                  username={f.username}
                  avatarColor={f.avatarColor}
                  avatarPath={f.avatarPath}
                  action={
                    <>
                      <button
                        onClick={() => withBusy(f.friendshipId, () => api.acceptFriend(f.friendshipId))}
                        disabled={busyId === f.friendshipId}
                        className="p-2 rounded-full bg-accent/20 text-accent hover:bg-accent/30 transition-colors disabled:opacity-40"
                        aria-label={`Accept ${f.email}`}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => withBusy(f.friendshipId, () => api.declineFriend(f.friendshipId))}
                        disabled={busyId === f.friendshipId}
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-40"
                        aria-label={`Decline ${f.email}`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  }
                />
              ))}
            </div>
          </section>
        )}

        {data.outgoing.length > 0 && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">Pending</h2>
            <div className="space-y-2">
              {data.outgoing.map((f) => (
                <Row
                  key={f.friendshipId}
                  userId={f.userId}
                  email={f.email}
                  username={f.username}
                  avatarColor={f.avatarColor}
                  avatarPath={f.avatarPath}
                  action={
                    <button
                      onClick={() => withBusy(f.friendshipId, () => api.removeFriend(f.friendshipId))}
                      disabled={busyId === f.friendshipId}
                      className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  }
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-3">
            Friends ({data.friends.length})
          </h2>
          {data.friends.length === 0 ? (
            <p className="text-white/40 text-sm">No friends yet — add one above.</p>
          ) : (
            <div className="space-y-2">
              {data.friends.map((f) => (
                <Row
                  key={f.friendshipId}
                  userId={f.userId}
                  email={f.email}
                  username={f.username}
                  avatarColor={f.avatarColor}
                  avatarPath={f.avatarPath}
                  action={
                    <button
                      onClick={() => withBusy(f.friendshipId, () => api.removeFriend(f.friendshipId))}
                      disabled={busyId === f.friendshipId}
                      className="text-xs text-white/50 hover:text-white transition-colors disabled:opacity-40"
                    >
                      Remove
                    </button>
                  }
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
