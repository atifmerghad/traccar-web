import { useState } from 'react';
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
  InputAdornment,
} from '@mui/material';
import { useTheme, alpha } from '@mui/material/styles';
import {
  ArrowBack,
  LockOpen as LockOpenIcon,
  GpsFixed,
  KeyboardArrowDown,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import ReactCountryFlag from 'react-country-flag';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useCatch } from '../../reactHelper';
import fetchOrThrow from '../../common/util/fetchOrThrow';
import { snackBarDurationShortMs } from '../../common/util/duration';
import { nativeEnvironment } from '../../common/components/NativeInterface';
import { useAuthV2PanelStyles, useAuthLanguage } from './LoginPageV2';

const ResetPasswordPageV2 = () => {
  const { classes } = useAuthV2PanelStyles();
  const theme = useTheme();
  const navigate = useNavigate();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  const [searchParams] = useSearchParams();
  const token = searchParams.get('passwordReset');

  const { languageList, languageMenuProps, language, setLocalLanguage, languageEnabled } =
    useAuthLanguage();

  const changeEnabled = useSelector((state) => !state.session.server.attributes.disableChange);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const emailOk = /(.+)@(.+)\.(.{2,})/.test(email);
  const canSubmit = token ? Boolean(password) : emailOk;

  const handleSubmit = useCatch(async (event) => {
    event.preventDefault();
    if (!token) {
      await fetchOrThrow('/api/password/reset', {
        method: 'POST',
        body: new URLSearchParams(`email=${encodeURIComponent(email)}`),
      });
    } else {
      await fetchOrThrow('/api/password/update', {
        method: 'POST',
        body: new URLSearchParams(
          `token=${encodeURIComponent(token)}&password=${encodeURIComponent(password)}`,
        ),
      });
    }
    setSnackbarOpen(true);
  });

  return (
    <Box className={classes.root}>
      <Box className={classes.topBar}>
        <IconButton
          onClick={() => navigate('/login-new')}
          sx={{ color: 'text.disabled', '&:hover': { color: 'primary.light' } }}
          size="small"
          aria-label="back"
        >
          <ArrowBack sx={{ fontSize: theme.typography.pxToRem(18) }} />
        </IconButton>
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
            {t('loginReset')}
          </Typography>
          <Typography
            sx={{
              fontSize: theme.typography.body2.fontSize,
              color: 'text.secondary',
              mt: 0.6,
              textAlign: 'center',
            }}
          >
            {token
              ? tt('resetPasswordEnterNew', 'Enter your new password')
              : tt('resetPasswordEmailHint', 'We will send reset instructions to your email')}
          </Typography>
        </Box>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          {!token ? (
            <TextField
              className={classes.input}
              fullWidth
              required
              type="email"
              label={t('userEmail')}
              name="email"
              value={email}
              autoComplete="email"
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              size="small"
            />
          ) : (
            <TextField
              className={classes.input}
              fullWidth
              required
              label={t('userPassword')}
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              autoComplete="new-password"
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              size="small"
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
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
                    </InputAdornment>
                  ),
                },
              }}
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
            {t('loginReset')}
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
              {tt('resetPasswordBackToLogin', 'Back to sign in')}
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
        onClose={() => navigate('/login-new')}
        autoHideDuration={snackBarDurationShortMs}
        message={!token ? t('loginResetSuccess') : t('loginUpdateSuccess')}
      />
    </Box>
  );
};

export default ResetPasswordPageV2;
