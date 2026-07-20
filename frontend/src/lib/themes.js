// Each color is "R G B" (space-separated, no commas) to match Tailwind's
// rgb(var(--x) / <alpha-value>) convention in tailwind.config.js.
export const THEMES = [
  { id: 'indigo', name: 'Indigo', accent: '99 102 241', dim: '67 56 202', glow: '139 92 246' },
  { id: 'ocean', name: 'Ocean Blue', accent: '37 99 235', dim: '29 78 216', glow: '96 165 250' },
  { id: 'violet', name: 'Violet', accent: '139 92 246', dim: '109 40 217', glow: '196 181 253' },
  { id: 'royal', name: 'Royal Purple', accent: '168 85 247', dim: '126 34 206', glow: '216 180 254' },
  { id: 'sky', name: 'Sky', accent: '14 165 233', dim: '3 105 161', glow: '56 189 248' },
];

export const DEFAULT_THEME_ID = 'indigo';

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === DEFAULT_THEME_ID);
}
