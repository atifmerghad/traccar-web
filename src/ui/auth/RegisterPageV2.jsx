import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  IconButton,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  Tooltip,
  Link,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  Visibility,
  VisibilityOff,
  ArrowBack,
  LockOpen as LockOpenIcon,
  GpsFixed,
  KeyboardArrowDown,
} from '@mui/icons-material';
import ReactCountryFlag from 'react-country-flag';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch, useEffectAsync } from '../../reactHelper';
import { sessionActions } from '../../store';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { snackBarDurationShortMs } from '../../common/util/duration';
import { nativeEnvironment } from '../../common/components/NativeInterface';
import { useAuthV2PanelStyles, useAuthLanguage } from './LoginPageV2';

const RegisterPageV2 = () => {
  const { classes } = useAuthV2PanelStyles();
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const { languageList, languageMenuProps, language, setLocalLanguage, languageEnabled } =
    useAuthLanguage();

  const server = useSelector((state) => state.session.server);
  const totpForce = useSelector((state) => state.session.server.attributes.totpForce);
  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [totpKey, setTotpKey] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffectAsync(async () => {
    if (totpForce) {
      const response = await fetchOrThrow('/api/users/totp', { method: 'POST' });
      setTotpKey(await response.text());
    }
  }, [totpForce, setTotpKey]);

  const emailOk = server.newServer || /(.+)@(.+)\.(.{2,})/.test(email);
  const canSubmit = Boolean(name.trim() && password && emailOk && (!totpForce || totpKey));

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    await fetchOrThrow('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, totpKey }),
    });
    setSnackbarOpen(true);
  });

  return (
    <Box className={classes.root}>
      <Box className={classes.topBar}>
        {!server.newServer && (
          <IconButton
            onClick={() => navigate('/login-new')}
            sx={{ color: 'text.disabled', '&:hover': { color: 'primary.light' } }}
            size="small"
            aria-label="back"
          >
            <ArrowBack sx={{ fontSize: theme.typography.pxToRem(18) }} />
          </IconButton>
        )}
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

      <Box className={classes.card}>
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
              boxShadow: (th) =>
                `0 ${th.spacing(0.75)} ${th.spacing(3)} ${alpha(th.palette.primary.main, 0.45)}`,
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
            {t('loginRegister')}
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: 'text.secondary',
              mt: 0.6,
              textAlign: 'center',
            }}
          >
            {tt('registerCardSubtitle', 'Create your account to get started')}
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField
            className={classes.input}
            fullWidth
            required
            label={t('sharedName')}
            name="name"
            value={name}
            autoComplete="name"
            autoFocus
            onChange={(e) => setName(e.target.value)}
            size="small"
          />
          <TextField
            className={classes.input}
            fullWidth
            required={!server.newServer}
            type={server.newServer ? 'text' : 'email'}
            label={t('userEmail')}
            name="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            size="small"
            helperText={
              server.newServer ? tt('registerEmailOptional', 'Optional on first setup') : ''
            }
          />
          <TextField
            className={classes.input}
            fullWidth
            required
            label={t('userPassword')}
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            size="small"
            slotProps={{
              input: {
                endAdornment: (
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                    sx={{ color: 'text.disabled' }}
                  >
                    {showPassword ? (
                      <VisibilityOff sx={{ fontSize: theme.typography.pxToRem(18) }} />
                    ) : (
                      <Visibility sx={{ fontSize: theme.typography.pxToRem(18) }} />
                    )}
                  </IconButton>
                ),
              },
            }}
          />
          {totpForce && (
            <TextField
              className={classes.input}
              fullWidth
              required
              label={t('loginTotpKey')}
              name="totpKey"
              value={totpKey || ''}
              slotProps={{ input: { readOnly: true } }}
              size="small"
            />
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disableElevation
            disabled={!canSubmit}
            sx={{
              mt: 0.5,
              height: theme.spacing(5.5),
              fontSize: theme.typography.pxToRem(14.75),
              fontWeight: 700,
              textTransform: 'none',
              borderRadius: theme.spacing(1.5),
              backgroundImage: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.primary.main} 100%)`,
              boxShadow: (th) =>
                `0 ${th.spacing(0.5)} ${th.spacing(2)} ${alpha(th.palette.secondary.main, 0.35)}`,
              '&:hover': {
                backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`,
              },
              '&.Mui-disabled': {
                backgroundColor: alpha(theme.palette.primary.main, 0.25),
                backgroundImage: 'none',
                color: alpha(theme.palette.common.white, 0.4),
              },
            }}
          >
            {t('loginRegister')}
          </Button>

          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
            <Link
              component="button"
              type="button"
              onClick={() => navigate('/login-new')}
              underline="none"
              sx={{
                fontSize: theme.typography.pxToRem(13.1),
                color: 'text.secondary',
                cursor: 'pointer',
                border: 'none',
                background: 'none',
                font: 'inherit',
                '&:hover': { color: 'primary.light' },
              }}
            >
              {tt('registerBackToLogin', 'Already have an account? Sign in')}
            </Link>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 3,
            pt: 2.5,
            borderTop: (th) =>
              `1px solid ${alpha(th.palette.divider, th.palette.mode === 'dark' ? 0.5 : 1)}`,
          }}
        >
          <Typography sx={{ fontSize: theme.typography.caption.fontSize, color: 'text.disabled' }}>
            {`© ${new Date().getFullYear()} Geo`}
          </Typography>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        onClose={() => {
          dispatch(sessionActions.updateServer({ ...server, newServer: false }));
          navigate('/login-new');
        }}
        autoHideDuration={snackBarDurationShortMs}
        message={t('loginCreated')}
      />
    </Box>
  );
};

export default RegisterPageV2;
