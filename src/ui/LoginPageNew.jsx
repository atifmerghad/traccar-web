import { useState, useEffect } from 'react';
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
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import usePersistedState from '../common/util/usePersistedState';
import { handleLoginTokenListeners, nativeEnvironment, nativePostMessage } from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import Loader from '../common/components/Loader';

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles()(() => ({
  root: {
    flex: '0 0 50%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#080d1a',
    minHeight: '100vh',
    position: 'relative',
    padding: '24px',
    '@media (max-width: 900px)': { flex: '1 1 100%' },
  },

  topBar: {
    position: 'absolute',
    top: 20,
    right: 20,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },

  card: {
    width: '100%',
    maxWidth: 440,
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 24,
    padding: '36px 36px 28px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },

  input: {
    '& .MuiOutlinedInput-root': {
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      color: '#e2e8f0',
      fontSize: '0.9rem',
      '& fieldset': { border: '1px solid rgba(255,255,255,0.1)' },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { color: '#64748b', fontSize: '0.9rem' },
    '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
    '& .MuiFormHelperText-root': { color: '#ef4444', fontSize: '0.75rem' },
    '& .MuiInputBase-input': { color: '#e2e8f0' },
  },

  langSelect: {
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '10px',
    color: '#94a3b8',
    fontSize: '0.82rem',
    '& .MuiOutlinedInput-notchedOutline': { border: '1px solid rgba(255,255,255,0.1)' },
    '& .MuiSelect-select': { py: '6px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 6 },
    '& .MuiSvgIcon-root': { color: '#475569' },
    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
  },
}));

const DARK_MENU = {
  PaperProps: {
    sx: {
      background: '#0f172a',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      mt: 0.5,
      '& .MuiMenuItem-root': { color: '#cbd5e1', fontSize: '0.84rem', gap: 1 },
      '& .MuiMenuItem-root:hover': { background: 'rgba(255,255,255,0.06)' },
      '& .MuiMenuItem-root.Mui-selected': { background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' },
    },
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPageNew = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();

  const { languages, language, setLanguage } = useLocalization();
  const languageList = Object.entries(languages).map(([code, val]) => ({
    code,
    country: val.country,
    name: val.name,
  }));

  const [failed, setFailed] = useState(false);
  const [email, setEmail] = usePersistedState('loginEmail', '');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [codeEnabled, setCodeEnabled] = useState(false);
  const [announcementShown, setAnnouncementShown] = useState(false);

  const registrationEnabled = useSelector((state) => state.session.server.registration);
  const languageEnabled = useSelector((state) => !state.session.server.attributes['ui.disableLoginLanguage']);
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);
  const emailEnabled = useSelector((state) => state.session.server.emailEnabled);
  const openIdEnabled = useSelector((state) => state.session.server.openIdEnabled);
  const openIdForced = useSelector((state) => state.session.server.openIdEnabled && state.session.server.openIdForce);
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
        navigate('/');
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
      navigate('/');
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
              sx={{ color: '#64748b', '&:hover': { color: '#a5b4fc' } }}
              size="small"
            >
              <LockOpenIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        )}
        {languageEnabled && (
          <FormControl size="small">
            <Select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className={classes.langSelect}
              IconComponent={KeyboardArrowDown}
              MenuProps={DARK_MENU}
              sx={{ minWidth: 110, height: 36 }}
            >
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <ReactCountryFlag countryCode={it.country} svg style={{ width: 18, height: 14 }} />
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
              width: 52,
              height: 52,
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 24px rgba(99,102,241,0.45)',
              mb: 2,
            }}
          >
            <GpsFixed sx={{ color: '#fff', fontSize: 26 }} />
          </Box>
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.01em' }}>
            Connectez-vous à{' '}
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(135deg, #818cf8, #6366f1)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Geo
            </Box>
          </Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#64748b', mt: 0.6, textAlign: 'center' }}>
            Entrez vos identifiants pour accéder à votre flotte
          </Typography>
        </Box>

        {/* Form */}
        <Box component="form" onSubmit={handlePasswordLogin} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
                      sx={{ color: '#475569', '&:hover': { color: '#94a3b8' } }}
                    >
                      {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
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
              height: 44,
              fontSize: '0.92rem',
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
              boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' },
              '&.Mui-disabled': { background: 'rgba(99,102,241,0.25)', color: 'rgba(255,255,255,0.4)' },
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
                height: 44,
                fontSize: '0.9rem',
                fontWeight: 600,
                textTransform: 'none',
                borderRadius: '12px',
                color: '#94a3b8',
                borderColor: 'rgba(255,255,255,0.1)',
                '&:hover': { borderColor: 'rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.04)' },
              }}
            >
              {t('loginOpenId')}
            </Button>
          )}

          {(registrationEnabled || emailEnabled) && (
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 0.5 }}>
              {registrationEnabled && (
                <Link
                  onClick={() => navigate('/register')}
                  underline="none"
                  sx={{ fontSize: '0.82rem', color: '#64748b', cursor: 'pointer', '&:hover': { color: '#818cf8' } }}
                >
                  {t('loginRegister')}
                </Link>
              )}
              {emailEnabled && (
                <Link
                  onClick={() => navigate('/reset-password')}
                  underline="none"
                  sx={{ fontSize: '0.82rem', color: '#64748b', cursor: 'pointer', '&:hover': { color: '#818cf8' } }}
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
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <Typography sx={{ fontSize: '0.75rem', color: '#334155' }}>© 2025 Geo</Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Link href="#" underline="none" sx={{ fontSize: '0.75rem', color: '#334155', '&:hover': { color: '#64748b' } }}>
              Confidentialité
            </Link>
            <Link href="#" underline="none" sx={{ fontSize: '0.75rem', color: '#334155', '&:hover': { color: '#64748b' } }}>
              Support
            </Link>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={!!announcement && !announcementShown}
        message={announcement}
        action={(
          <IconButton size="small" color="inherit" onClick={() => setAnnouncementShown(true)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      />
    </Box>
  );
};

export default LoginPageNew;
