import React, { useState, useEffect } from 'react';
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
} from '@mui/icons-material';
import ReactCountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { sessionActions } from '../store';
import { useLocalization, useTranslation } from '../common/components/LocalizationProvider';
import usePersistedState from '../common/util/usePersistedState';
import { handleLoginTokenListeners, nativeEnvironment, nativePostMessage } from '../common/components/NativeInterface';
import { useCatch } from '../reactHelper';
import Loader from '../common/components/Loader';

const useStyles = makeStyles()((theme) => ({
  rightPanel: {
    flex: '0 0 50%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(6, 8),
    backgroundColor: theme.palette.background.default,
    minHeight: '100vh',
    [theme.breakpoints.down('md')]: {
      flex: '1 1 100%',
      padding: theme.spacing(4),
      minHeight: '100vh',
    },
  },
  formContainer: {
    width: '100%',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: theme.spacing(1),
    color: theme.palette.text.primary,
    textAlign: 'center',
    [theme.breakpoints.down('sm')]: {
      fontSize: '1.75rem',
    },
  },
  subtitle: {
    color: theme.palette.text.secondary,
    marginBottom: `${theme.spacing(5)} !important`,
    fontSize: '0.95rem',
    textAlign: 'center',
    display: 'block',
    width: '100%',
    [theme.breakpoints.down('sm')]: {
      marginBottom: theme.spacing(12),
    },
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(3),
    marginTop: 0,
  },
  textField: {
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.background.paper : 'white',
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(1),
      '& fieldset': {
        borderColor: theme.palette.divider,
      },
      '&:hover fieldset': {
        borderColor: theme.palette.mode === 'dark' ? theme.palette.primary.light : theme.palette.primary.main,
      },
      '&.Mui-focused fieldset': {
        borderColor: theme.palette.primary.main,
      },
    },
    '& .MuiInputLabel-root': {
      color: theme.palette.text.secondary,
      '&.Mui-focused': {
        color: theme.palette.primary.main,
      },
    },
  },
  loginButton: {
    padding: theme.spacing(1.75),
    fontSize: '1rem',
    fontWeight: 600,
    textTransform: 'none',
    borderRadius: theme.spacing(1),
    marginTop: theme.spacing(2),
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    color: theme.palette.primary.contrastText || 'white',
    '&:hover': {
      background: `linear-gradient(135deg, ${theme.palette.primary.dark || theme.palette.primary.main} 0%, ${theme.palette.secondary.dark || theme.palette.secondary.main} 100%)`,
    },
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: theme.spacing(6),
    paddingTop: theme.spacing(4),
    fontSize: '0.875rem',
    color: theme.palette.text.secondary,
    [theme.breakpoints.down('sm')]: {
      flexDirection: 'column',
      gap: theme.spacing(1),
      alignItems: 'flex-start',
      marginTop: theme.spacing(4),
    },
  },
  footerLinks: {
    display: 'flex',
    gap: theme.spacing(3),
  },
  footerLink: {
    color: theme.palette.text.secondary,
    textDecoration: 'none',
    cursor: 'pointer',
    '&:hover': {
      textDecoration: 'underline',
      color: theme.palette.text.primary,
    },
  },
  options: {
    position: 'absolute',
    top: theme.spacing(2),
    right: theme.spacing(2),
    display: 'flex',
    flexDirection: 'row',
    gap: theme.spacing(1),
  },
  extraContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing(4),
    marginTop: theme.spacing(2),
  },
}));

const LoginPageNew = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const t = useTranslation();

  const { languages, language, setLanguage } = useLocalization();
  const languageList = Object.entries(languages).map((values) => ({ code: values[0], country: values[1].country, name: values[1].name }));

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
        if (response.ok) {
          token = await response.text();
        }
      } catch (error) {
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
    } catch (error) {
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
    return (<Loader />);
  }

  return (
    <Box className={classes.rightPanel}>
      {/* Options (Language selector and server change) */}
      <Box className={classes.options}>
        {nativeEnvironment && changeEnabled && (
          <Tooltip title={t('settingsServer')}>
            <IconButton onClick={() => navigate('/change-server')}>
              <LockOpenIcon />
            </IconButton>
          </Tooltip>
        )}
        {languageEnabled && (
          <FormControl>
            <Select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {languageList.map((it) => (
                <MenuItem key={it.code} value={it.code}>
                  <Box component="span" sx={{ mr: 1 }}>
                    <ReactCountryFlag countryCode={it.country} svg />
                  </Box>
                  {it.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
      </Box>

      <Box className={classes.formContainer}>
        <Typography className={classes.title}>
          Connectez-vous à Tracky
        </Typography>
        <Typography className={classes.subtitle}>
          Entrez vos identifiants pour accéder à votre flotte
        </Typography>

        <form className={classes.form} onSubmit={handlePasswordLogin}>
          <TextField
            className={classes.textField}
            fullWidth
            required
            error={failed}
            label={t('userEmail')}
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText={failed && t('loginFailed')}
            autoComplete="email"
            autoFocus={!email}
          />

          <TextField
            className={classes.textField}
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
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {codeEnabled && (
            <TextField
              className={classes.textField}
              fullWidth
              required
              error={failed}
              label={t('loginTotpCode')}
              name="code"
              value={code}
              type="number"
              onChange={(e) => setCode(e.target.value)}
            />
          )}

          <Button
            type="submit"
            variant="contained"
            fullWidth
            className={classes.loginButton}
            size="large"
            disabled={!email || !password || (codeEnabled && !code)}
          >
            {t('loginLogin')}
          </Button>

          {openIdEnabled && (
            <Button
              onClick={handleOpenIdLogin}
              variant="contained"
              fullWidth
              className={classes.loginButton}
              size="large"
            >
              {t('loginOpenId')}
            </Button>
          )}

          <Box className={classes.extraContainer}>
            {registrationEnabled && (
              <Link
                onClick={() => navigate('/register')}
                className={classes.footerLink}
                underline="none"
                variant="caption"
              >
                {t('loginRegister')}
              </Link>
            )}
            {emailEnabled && (
              <Link
                onClick={() => navigate('/reset-password')}
                className={classes.footerLink}
                underline="none"
                variant="caption"
              >
                {t('loginReset')}
              </Link>
            )}
          </Box>
        </form>

        {/* Footer */}
        <Box className={classes.footer}>
          <Typography variant="body2">© 2025 Tracky</Typography>
          <Box className={classes.footerLinks}>
            <Link href="#" className={classes.footerLink}>
              Privacy Policy
            </Link>
            <Link href="#" className={classes.footerLink}>
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

