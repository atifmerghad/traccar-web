import { useMemo } from 'react';
import { createTheme } from '@mui/material/styles';
import palette from './palette';
import dimensions from './dimensions';
import components from './components';

export default (server, darkMode, direction, language) =>
  useMemo(() => {
    const isArabic = typeof language === 'string' && language.slice(0, 2) === 'ar';
    const fontFamily = isArabic
      ? '"Almarai",Roboto,"Segoe UI","Helvetica Neue",Arial,sans-serif'
      : 'Roboto,Segoe UI,Helvetica Neue,Arial,sans-serif';
    return createTheme({
      typography: {
        fontFamily,
      },
      palette: palette(server, darkMode),
      direction,
      dimensions,
      components,
    });
  }, [server, darkMode, direction, language]);
