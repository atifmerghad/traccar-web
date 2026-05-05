import { useSelector } from 'react-redux';
import { ThemeProvider, useMediaQuery } from '@mui/material';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import theme from './common/theme';
import { useLocalization } from './common/components/LocalizationProvider';

const cache = {
  ltr: createCache({
    key: 'muiltr',
  }),
  rtl: createCache({
    key: 'muirtl',
    // Keep RTL transform only; avoid external stylis prefixer mismatch with Emotion runtime.
    stylisPlugins: [rtlPlugin],
  }),
};

const AppThemeProvider = ({ children }) => {
  const server = useSelector((state) => state.session.server);
  const { direction } = useLocalization();

  const serverDarkMode = true;//server?.attributes?.darkMode;
  const preferDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const darkMode = serverDarkMode !== undefined ? serverDarkMode : preferDarkMode;

  const themeInstance = theme(server, darkMode, direction);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
