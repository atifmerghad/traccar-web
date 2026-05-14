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
    // Dark: near-neutral canvas with a slight cool cast; paper is a clear step up for cards/panels.
    default: darkMode ? '#0d1117' : grey[50],
    paper: darkMode ? '#161b22' : '#ffffff',
  },
  text: {
    primary: darkMode ? '#e6edf3' : grey[900],
    secondary: darkMode ? '#8b949e' : grey[600],
    disabled: darkMode ? '#484f58' : grey[400],
  },
  divider: darkMode ? 'rgba(230, 237, 243, 0.12)' : 'rgba(0, 0, 0, 0.12)',
  primary: {
    // Dark: lighter indigo for contrast on deep surfaces; light: deep indigo.
    main: validatedColor(server?.attributes?.colorPrimary) || (darkMode ? '#818cf8' : indigo[900]),
  },
  secondary: {
    main: validatedColor(server?.attributes?.colorSecondary) || (darkMode ? '#56d364' : green[800]),
  },
  // State-layer opacities aligned with Material Design 3 interaction specs.
  action: {
    hover: darkMode ? 'rgba(230, 237, 243, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    selected: darkMode ? 'rgba(230, 237, 243, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    focus: darkMode ? 'rgba(230, 237, 243, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    disabledBackground: darkMode ? 'rgba(230, 237, 243, 0.12)' : 'rgba(0, 0, 0, 0.12)',
    disabled: darkMode ? '#484f58' : grey[400],
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
