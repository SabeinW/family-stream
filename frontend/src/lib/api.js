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

  listProfiles: () => request('/profiles'),
  createProfile: (data) => request('/profiles', { method: 'POST', body: JSON.stringify(data) }),
  selectProfile: (id, pin) => request(`/profiles/${id}/select`, { method: 'POST', body: JSON.stringify({ pin }) }),

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

  streamUrl: (id, quality) => {
    const params = new URLSearchParams({ profileToken: localStorage.getItem('fs_profile_token') || '' });
    if (quality && quality !== 'Auto') params.set('quality', quality);
    return `${BASE}/stream/${id}?${params.toString()}`;
  },
  photoUrl: (id) => `${BASE}/stream/photo/${id}?profileToken=${encodeURIComponent(localStorage.getItem('fs_profile_token') || '')}`,
  thumbnailUrl: (id) => `${BASE}/stream/thumbnail/${id}`,
};
