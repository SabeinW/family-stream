const BASE = '/api';

function authHeaders() {
  const token = localStorage.getItem('fs_token');
  const profileToken = localStorage.getItem('fs_profile_token');
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (profileToken) headers['x-profile-token'] = profileToken;
  return headers;
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  register: (email, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => request('/auth/me'),
  setUsername: (username) => request('/auth/username', { method: 'PATCH', body: JSON.stringify({ username }) }),

  listProfiles: () => request('/profiles'),
  createProfile: (data) => request('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  selectProfile: (id, pin) => request(`/profiles/${id}/select`, { method: 'POST', body: JSON.stringify({ pin }) }),
  renameProfile: (id, name) => request(`/profiles/${id}`, { method: 'PATCH', body: JSON.stringify({ name }) }),
  uploadAvatar: (id, file) => {
    const form = new FormData();
    form.append('avatar', file);
    return request(`/profiles/${id}/avatar`, { method: 'POST', body: form });
  },
  // `version` (pass the profile's avatarPath, which changes to a fresh
  // filename on every upload) cache-busts the <img> so a replaced photo
  // shows up immediately instead of the browser serving the old cached one.
  avatarUrl: (id, version) => {
    const params = new URLSearchParams({ token: localStorage.getItem('fs_token') || '' });
    if (version) params.set('v', version);
    return `${BASE}/profiles/${id}/avatar?${params.toString()}`;
  },

  listFriends: () => request('/friends'),
  sendFriendRequest: (identifier) => request('/friends/request', { method: 'POST', body: JSON.stringify({ identifier }) }),
  acceptFriend: (id) => request(`/friends/${id}/accept`, { method: 'POST' }),
  declineFriend: (id) => request(`/friends/${id}/decline`, { method: 'POST' }),
  removeFriend: (id) => request(`/friends/${id}`, { method: 'DELETE' }),

  listMedia: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/media${qs ? `?${qs}` : ''}`);
  },
  getMedia: (id) => request(`/media/${id}`),
  categories: () => request('/media/categories'),
  favorites: () => request('/media/profile/favorites'),
  toggleFavorite: (id) => request(`/media/${id}/favorite`, { method: 'POST' }),
  saveProgress: (id, positionSec) =>
    request(`/media/${id}/progress`, { method: 'PUT', body: JSON.stringify({ positionSec }) }),
  upload: (formData) => request('/media/upload', { method: 'POST', body: formData }),
  updateVisibility: (id, data) => request(`/media/${id}/visibility`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMedia: (id) => request(`/media/${id}`, { method: 'DELETE' }),

  listPlaylists: () => request('/playlists'),
  createPlaylist: (data) => request('/playlists', { method: 'POST', body: JSON.stringify(data) }),
  getPlaylist: (id) => request(`/playlists/${id}`),
  updatePlaylist: (id, data) => request(`/playlists/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deletePlaylist: (id) => request(`/playlists/${id}`, { method: 'DELETE' }),
  addPlaylistItem: (id, mediaId) => request(`/playlists/${id}/items`, { method: 'POST', body: JSON.stringify({ mediaId }) }),
  removePlaylistItem: (id, mediaId) => request(`/playlists/${id}/items/${mediaId}`, { method: 'DELETE' }),

  streamUrl: (id, quality) => {
    const params = new URLSearchParams({ profileToken: localStorage.getItem('fs_profile_token') || '' });
    if (quality && quality !== 'Auto') params.set('quality', quality);
    return `${BASE}/stream/${id}?${params.toString()}`;
  },
  photoUrl: (id) => `${BASE}/stream/photo/${id}?profileToken=${encodeURIComponent(localStorage.getItem('fs_profile_token') || '')}`,
  thumbnailUrl: (id) => `${BASE}/stream/thumbnail/${id}?profileToken=${encodeURIComponent(localStorage.getItem('fs_profile_token') || '')}`,
  downloadUrl: (id) => `${BASE}/stream/download/${id}?profileToken=${encodeURIComponent(localStorage.getItem('fs_profile_token') || '')}`,

  storageUsage: () => request('/storage/usage'),
};
