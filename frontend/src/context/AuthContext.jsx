import React, { createContext, useContext, useState, useCallback } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem('fs_token'));
  const [profile, setProfile] = useState(() => {
    const raw = localStorage.getItem('fs_profile');
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (email, password) => {
    const { token: t } = await api.login(email, password);
    localStorage.setItem('fs_token', t);
    setToken(t);
  }, []);

  const register = useCallback(async (email, password) => {
    const { token: t } = await api.register(email, password);
    localStorage.setItem('fs_token', t);
    setToken(t);
  }, []);

  const chooseProfile = useCallback(async (profileId, pin) => {
    const { profileToken, profile: p } = await api.selectProfile(profileId, pin);
    localStorage.setItem('fs_profile_token', profileToken);
    localStorage.setItem('fs_profile', JSON.stringify(p));
    setProfile(p);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('fs_token');
    localStorage.removeItem('fs_profile_token');
    localStorage.removeItem('fs_profile');
    setToken(null);
    setProfile(null);
  }, []);

  const switchProfile = useCallback(() => {
    localStorage.removeItem('fs_profile_token');
    localStorage.removeItem('fs_profile');
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ token, profile, login, register, logout, chooseProfile, switchProfile, isAuthed: !!token, hasProfile: !!profile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
