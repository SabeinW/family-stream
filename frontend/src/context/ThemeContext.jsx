import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
import { THEMES, DEFAULT_THEME_ID, getTheme } from '../lib/themes.js';

const ThemeContext = createContext(null);

function storageKey(profileId) {
  return `fs_theme_${profileId || 'account'}`;
}

function applyTheme(theme) {
  const root = document.documentElement.style;
  root.setProperty('--accent-rgb', theme.accent);
  root.setProperty('--accent-dim-rgb', theme.dim);
  root.setProperty('--accent-glow-rgb', theme.glow);
}

export function ThemeProvider({ children }) {
  const { profile } = useAuth();
  const [themeId, setThemeId] = useState(DEFAULT_THEME_ID);

  // Re-read the saved preference whenever the active profile changes (each
  // family profile remembers its own color theme, scoped by profile id).
  useEffect(() => {
    const saved = localStorage.getItem(storageKey(profile?.id)) || DEFAULT_THEME_ID;
    setThemeId(saved);
    applyTheme(getTheme(saved));
  }, [profile?.id]);

  const setTheme = useCallback((id) => {
    localStorage.setItem(storageKey(profile?.id), id);
    setThemeId(id);
    applyTheme(getTheme(id));
  }, [profile?.id]);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
