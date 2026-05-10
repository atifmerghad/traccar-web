import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  TextField,
  Button,
  Typography,
  InputAdornment,
  IconButton,
  Link,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  Close as CloseIcon,
  LockOpen as LockOpenIcon,
  GpsFixed,
  KeyboardArrowDown,
} from '@mui/icons-material';
import ReactCountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../../store';
import { useLocalization, useTranslation } from '../../common/components/LocalizationProvider';
import usePersistedState from '../../common/util/usePersistedState';
import {
  handleLoginTokenListeners,
  nativeEnvironment,
  nativePostMessage,
} from '../../common/components/NativeInterface';
import { useCatch } from '../../reactHelper';
import Loader from '../../common/components/Loader';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  const panelAngle = theme.direction === 'rtl' ? '200deg' : '160deg';
  const bgDefault = theme.palette.background.default;
  const primary = theme.palette.primary.main;
  const paper = theme.palette.background.paper;
  const inputBorder = isDark
    ? alpha(theme.palette.common.white, 0.35)
    : alpha(theme.palette.common.black, 0.12);
  const inputBorderHover = isDark ? alpha(theme.palette.common.white, 0.7) : alpha(primary, 0.55);

  const darkPanelGradient = `linear-gradient(${panelAngle}, ${alpha(paper, 0.95)} 0%, ${bgDefault} 45%, ${alpha(paper, 0.85)} 100%)`;
  const lightPanelGradient = `linear-gradient(${panelAngle}, ${alpha(primary, 0.12)} 0%, ${bgDefault} 45%, ${alpha(primary, 0.06)} 100%)`;

  return {
    root: {
      flex: '0 0 50%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      // backgroundImage not background — stylis-rtl/cssjanus corrupts N% stops inside background:
      backgroundColor: bgDefault,
      backgroundImage: isDark ? darkPanelGradient : lightPanelGradient,
      minHeight: '100vh',
      position: 'relative',
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { flex: '1 1 100%' },
    },

    topBar: {
      position: 'absolute',
      top: theme.spacing(2.5),
      insetInlineEnd: theme.spacing(2.5),
      display: 'flex',
      alignItems: 'center',
      gap: theme.spacing(1),
    },

    card: {
      width: '100%',
      maxWidth: theme.spacing(55),
      backgroundColor: alpha(paper, 0.9),
      backdropFilter: `blur(${theme.spacing(2.5)})`,
      WebkitBackdropFilter: `blur(${theme.spacing(2.5)})`,
      border: `1px solid ${isDark ? alpha(theme.palette.common.white, 0.12) : alpha(theme.palette.common.black, 0.12)}`,
      borderRadius: theme.spacing(3),
      padding: theme.spacing(4.5, 4.5, 3.5),
      boxShadow: isDark
        ? `0 ${theme.spacing(3)} ${theme.spacing(8)} ${alpha(theme.palette.common.black, 0.6)}`
        : `0 ${theme.spacing(2.25)} ${theme.spacing(5)} ${alpha(theme.palette.common.black, 0.12)}`,
    },

    input: {
      '& .MuiOutlinedInput-root': {
        backgroundColor: isDark ? alpha(paper, 0.85) : theme.palette.background.paper,
        borderRadius: theme.spacing(1.5),
        color: theme.palette.text.primary,
        fontSize: theme.typography.body2.fontSize,
        '& fieldset': {
          border: `1px solid ${inputBorder}`,
        },
        '&:hover fieldset': {
          borderColor: inputBorderHover,
        },
        '&.Mui-focused fieldset': { borderColor: primary, borderWidth: 2 },
      },
      '& .MuiInputLabel-root': {
        color: theme.palette.text.secondary,
        fontSize: theme.typography.body2.fontSize,
      },
      '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.light },
      '& .MuiFormHelperText-root': {
        color: theme.palette.error.main,
        fontSize: theme.typography.caption.fontSize,
      },
      '& .MuiInputBase-input': { color: theme.palette.text.primary },
    },

    langSelect: {
      backgroundColor: isDark ? alpha(paper, 0.85) : theme.palette.background.paper,
      borderRadius: theme.spacing(1.25),
      color: theme.palette.text.secondary,
      fontSize: theme.typography.pxToRem(13.1),
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${inputBorder}`,
      },
      '& .MuiSelect-select': {
        py: theme.spacing(0.75),
        fontSize: theme.typography.pxToRem(13.1),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.75),
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.text.disabled,
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: inputBorderHover,
      },
    },
  };
});

// ─── Shared language hook ─────────────────────────────────────────────────────

export const useAuthLanguage = () => {
  const theme = useTheme();
  const { languages, language, setLocalLanguage } = useLocalization();
  const languageList = ['ar', 'fr', 'en']
    .map((code) => {
      const val = languages[code];
      if (!val) return null;
      return { code, country: val.country, name: val.name };
    })
    .filter(Boolean);
  const languageMenuProps = useMemo(
    () => ({
      PaperProps: {
        sx: {
          bgcolor: 'background.paper',
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: theme.spacing(1.5),
          mt: 0.5,
          '& .MuiMenuItem-root': {
            color: 'text.secondary',
            fontSize: theme.typography.body2.fontSize,
            gap: theme.spacing(1),
          },
          '& .MuiMenuItem-root:hover': {
            bgcolor:
              theme.palette.mode === 'dark'
                ? alpha(theme.palette.common.white, 0.06)
                : 'action.hover',
          },
          '& .MuiMenuItem-root.Mui-selected': {
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: 'primary.light',
          },
        },
      },
    }),
    [theme],
  );
  const languageEnabled = useSelector(
    (state) => !state.session.server.attributes['ui.disableLoginLanguage'],
  );
  return { languageList, languageMenuProps, language, setLocalLanguage, languageEnabled };
};

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPageV2 = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const { languageList, languageMenuProps, language, setLocalLanguage, languageEnabled } =
    useAuthLanguage();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [failed, setFailed] = useState(false);
  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [announcementShown, setAnnouncementShown] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector(
    (state) => state.session.server.openIdEnabled && state.session.server.openIdForce,
  );
  const announcement = useSelector((state) => state.session.server.announcement);

  const generateLoginToken = async () => {
    if (nativeEnvironment) {
      let token = '';
      try {
        const expiration = dayjs().add(6, 'months').toISOString();
        const response = await fetch('/api/session/token', {
          method: 'POST',
          body: new URLSearchParams(`expiration=${expiration}`),
        });
        if (response.ok) token = await response.text();
      } catch {
        token = '';
      }
      nativePostMessage(`login|${token}`);
    }
  };

  const handlePasswordLogin = async (event) => {
    event.preventDefault();
    setFailed(false);
    try {
      const query = `email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`;
      const response = await fetch('/api/session', {
        method: 'POST',
        body: new URLSearchParams(code.length ? `${query}&code=${code}` : query),
      });
      if (response.ok) {
        const user = await response.json();
        generateLoginToken();
        dispatch(sessionActions.updateUser(user));
        navigate('/dashboard');
      } else if (response.status === 401 && response.headers.get('WWW-Authenticate') === 'TOTP') {
        setCodeEnabled(true);
      } else {
        throw Error(await response.text());
      }
    } catch {
      setFailed(true);
      setPassword('');
    }
  };

  const handleTokenLogin = useCatch(async (token) => {
    const response = await fetch(`/api/session?token=${encodeURIComponent(token)}`);
    if (response.ok) {
      const user = await response.json();
      dispatch(sessionActions.updateUser(user));
      navigate('/dashboard');
    } else {
      throw Error(await response.text());
    }
  });

  const handleOpenIdLogin = () => {
    document.location = '/api/session/openid/auth';
  };

  useEffect(() => nativePostMessage('authentication'), []);

  useEffect(() => {
    const listener = (token) => handleTokenLogin(token);
    handleLoginTokenListeners.add(listener);
    return () => handleLoginTokenListeners.delete(listener);
  }, []);

  if (openIdForced) {
    handleOpenIdLogin();
    return <Loader />;
  }

  return (
    <Box className={classes.root}>
      {/* Top-right: server change + language */}
      <Box className={classes.topBar}>
        {nativeEnvironment && changeEnabled && (
          <Tooltip title={t('settingsServer')}>
            <IconButton
              onClick={() => navigate('/change-server')}
              sx={{ color: 'text.disabled', '&:hover': { color: 'primary.light' } }}
              size="small"
            >
              <LockOpenIcon sx={{ fontSize: theme.typography.pxToRem(18) }} />
            </IconButton>
          </Tooltip>
        )}
        {languageEnabled && (
          <FormControl size="small">
            <Select
              value={language}
              onChange={(e) => setLocalLanguage(e.target.value)}
              className={classes.langSelect}
              IconComponent={KeyboardArrowDown}
              MenuProps={languageMenuProps}
              sx={{ minWidth: theme.spacing(13.75), height: theme.spacing(4.5) }}
            >
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <ReactCountryFlag
                    countryCode={it.country}
                    svg
                    style={{ width: theme.spacing(2.25), height: theme.spacing(1.75) }}
                  />
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      {/* Login card */}
      <Box className={classes.card}>
        {/* Card logo */}
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3.5 }}>
          <Box
            sx={{
              width: theme.spacing(6.5),
              height: theme.spacing(6.5),
              borderRadius: theme.spacing(1.75),
              backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (t) =>
                `0 ${t.spacing(0.75)} ${t.spacing(3)} ${alpha(t.palette.primary.main, 0.45)}`,
              mb: 2,
            }}
          >
            <GpsFixed sx={{ color: 'common.white', fontSize: theme.typography.h5.fontSize }} />
          </Box>
          <Typography
            sx={{
              fontSize: theme.typography.h4.fontSize,
              fontWeight: 800,
              color: 'text.primary',
              letterSpacing: '-0.01em',
            }}
          >
            {t('loginLogin')}{' '}
            <Box
              component="span"
              sx={{
                backgroundImage: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.primary.main})`,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              {tt('loginBrandName', 'Geo')}
            </Box>
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: 'text.secondary',
              mt: 0.6,
              textAlign: 'center',
            }}
          >
            {tt('loginCardSubtitle', 'Sign in to continue')}
          </Typography>
        </Box>

        {/* Form */}
        <Box
          component="form"
          onSubmit={handlePasswordLogin}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            className={classes.input}
            fullWidth
            required
            error={failed}
            label={t('userEmail')}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText={failed ? t('loginFailed') : ''}
            autoComplete="email"
            autoFocus={!email}
            size="small"
          />

          <TextField
            className={classes.input}
            fullWidth
            required
            error={failed}
            label={t('userPassword')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            autoFocus={!!email}
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      size="small"
                      sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
                    >
                      {showPassword ? (
                        <VisibilityOff sx={{ fontSize: theme.typography.pxToRem(18) }} />
                      ) : (
                        <Visibility sx={{ fontSize: theme.typography.pxToRem(18) }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {codeEnabled && (
            <TextField
              className={classes.input}
              fullWidth
              required
              error={failed}
              label={t('loginTotpCode')}
              name="code"
              value={code}
              type="number"
              onChange={(e) => setCode(e.target.value)}
              size="small"
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            disableElevation
            disabled={!email || !password || (codeEnabled && !code)}
            sx={{
              mt: 0.5,
              height: theme.spacing(5.5),
              fontSize: theme.typography.pxToRem(14.75),
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: theme.spacing(1.5),
              backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              boxShadow: (t) =>
                `0 ${t.spacing(0.5)} ${t.spacing(2)} ${alpha(t.palette.primary.main, 0.35)}`,
              '&:hover': {
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(theme.palette.primary.main, 0.25),
                backgroundImage: 'none',
                color: alpha(theme.palette.common.white, 0.4),
              },
            }}
          >
            {t('loginLogin')}
          </Button>

          {openIdEnabled && (
            <Button
              onClick={handleOpenIdLogin}
              variant="outlined"
              fullWidth
              sx={{
                height: theme.spacing(5.5),
                fontSize: theme.typography.body2.fontSize,
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: theme.spacing(1.5),
                color: 'text.secondary',
                borderColor: (t) =>
                  t.palette.mode === 'dark'
                    ? alpha(t.palette.common.white, 0.1)
                    : t.palette.divider,
                '&:hover': {
                  borderColor: (t) =>
                    t.palette.mode === 'dark'
                      ? alpha(t.palette.common.white, 0.25)
                      : t.palette.primary.main,
                  bgcolor: (t) =>
                    t.palette.mode === 'dark'
                      ? alpha(t.palette.common.white, 0.04)
                      : t.palette.action.hover,
                },
              }}
            >
              {t('loginOpenId')}
            </Button>
          )}

          {(registrationEnabled || emailEnabled) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 0.5 }}>
              {registrationEnabled && (
                <Link
                  onClick={() => navigate('/register-new')}
                  underline="none"
                  sx={{
                    fontSize: theme.typography.pxToRem(13.1),
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.light' },
                  }}
                >
                  {t('loginRegister')}
                </Link>
              )}
              {emailEnabled && (
                <Link
                  onClick={() => navigate('/reset-password-new')}
                  underline="none"
                  sx={{
                    fontSize: theme.typography.pxToRem(13.1),
                    color: 'text.secondary',
                    cursor: 'pointer',
                    '&:hover': { color: 'primary.light' },
                  }}
                >
                  {t('loginReset')}
                </Link>
              )}
            </Box>
          )}
        </Box>

        {/* Card footer */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            pt: 2.5,
            borderTop: (t) =>
              `1px solid ${alpha(t.palette.divider, t.palette.mode === 'dark' ? 0.5 : 1)}`,
          }}
        >
          <Typography sx={{ fontSize: theme.typography.caption.fontSize, color: 'text.disabled' }}>
            {`© ${new Date().getFullYear()} Geo`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link
              href="#"
              underline="none"
              sx={{
                fontSize: theme.typography.caption.fontSize,
                color: 'text.disabled',
                '&:hover': { color: 'text.secondary' },
              }}
            >
              {tt('userPrivacy', 'Privacy')}
            </Link>
            <Link
              href="#"
              underline="none"
              sx={{
                fontSize: theme.typography.caption.fontSize,
                color: 'text.disabled',
                '&:hover': { color: 'text.secondary' },
              }}
            >
              {tt('settingsSupport', 'Support')}
            </Link>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        }
      />
    </Box>
  );
};

/** Shared panel styles for Login V2 and Register V2 forms. */
export const useAuthV2PanelStyles = useStyles;

export default LoginPageV2;
