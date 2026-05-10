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
  const userDarkMode = useSelector((state) => state.session?.user?.attributes?.darkMode);
  const { direction, language } = useLocalization();

  const serverDarkMode = server?.attributes?.darkMode;
  const preferDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  // Precedence: explicit user choice → admin server default → system preference.
  const darkMode =
    userDarkMode !== undefined
      ? userDarkMode
      : serverDarkMode !== undefined
        ? serverDarkMode
        : preferDarkMode;

  const themeInstance = theme(server, darkMode, direction, language);

  return (
    <CacheProvider value={cache[direction]}>
      <ThemeProvider theme={themeInstance}>{children}</ThemeProvider>
    </CacheProvider>
  );
};

export default AppThemeProvider;
