import { grey, green, indigo } from '@mui/material/colors';

const validatedColor = (color) => {
  if (!color || typeof color !== 'string') return null;
  const value = color.trim();
  if (!value) return null;
  if (/^#([0-9A-Fa-f]{3}){1,2}$/.test(value)) return value;
  if (typeof window !== 'undefined' && window.CSS?.supports?.('color', value)) return value;
  return null;
};

export default (server, darkMode) => ({
  mode: darkMode ? 'dark' : 'light',
  background: {
    default: darkMode ? '#080d1a' : grey[50],
    paper: darkMode ? '#0f172a' : '#ffffff',
  },
  text: {
    primary: darkMode ? '#f1f5f9' : grey[900],
    secondary: darkMode ? '#94a3b8' : grey[600],
    disabled: darkMode ? '#475569' : grey[400],
  },
  divider: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
  primary: {
    main: validatedColor(server?.attributes?.colorPrimary) || (darkMode ? '#6366f1' : indigo[900]),
  },
  secondary: {
    main: validatedColor(server?.attributes?.colorSecondary) || (darkMode ? '#22c55e' : green[800]),
  },
  action: {
    hover: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    selected: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
    disabledBackground: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)',
    disabled: darkMode ? '#475569' : grey[400],
  },
  neutral: {
    main: grey[500],
  },
  geometry: {
    main: '#3bb2d0',
  },
  alwaysDark: {
    main: grey[900],
  },
});
