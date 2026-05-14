import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

/** MUI baseline theme (typography, shape defaults) — not bundled as a public entry path in some builds. */
const defaultBaseTheme = createTheme();

export default (server, darkMode, direction, language) =>
  useMemo(() => {
    const isArabic = typeof language === 'string' && language.slice(0, 2) === 'ar';
    const fontFamily = isArabic
      ? '"Almarai",Roboto,"Segoe UI","Helvetica Neue",Arial,sans-serif'
      : 'Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif';
    return createTheme({
      shape: {
        ...defaultBaseTheme.shape,
        borderRadius: 12,
      },
      typography: {
        ...defaultBaseTheme.typography,
        fontFamily,
        allVariants: {
          ...defaultBaseTheme.typography.allVariants,
          fontFamily,
        },
        button: {
          ...defaultBaseTheme.typography.button,
          textTransform: 'none',
        },
      },
      palette: palette(server, darkMode),
      direction,
      dimensions,
      components,
    });
  }, [server, darkMode, direction, language]);
