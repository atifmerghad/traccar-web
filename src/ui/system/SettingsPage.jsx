import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  Snackbar,
  Alert,
  MenuItem,
} from '@mui/material';
import {
  ArrowBack,
  Check,
  Language,
  EmailOutlined,
  PhoneOutlined,
  PersonOutlined,
  TranslateOutlined,
  InfoOutlined,
} from '@mui/icons-material';
import ReactCountryFlag from 'react-country-flag';
import { makeStyles } from 'tss-react/mui';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from '../../store';
import { useCatch } from '../../reactHelper';
import { useTranslation, useLocalization } from '../../common/components/LocalizationProvider';
import PageLayout from '../layout/PageLayout';

const useStyles = makeStyles()((theme) => {
  const isDark = theme.palette.mode === 'dark';
  return {
    root: {
      width: '100%',
      flex: 1,
      boxSizing: 'border-box',
      padding: theme.spacing(3),
      [theme.breakpoints.down('md')]: { padding: theme.spacing(2) },
      [theme.breakpoints.down('sm')]: { padding: theme.spacing(1.5) },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    sectionCard: {
      borderRadius: theme.spacing(2),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.05)
        : theme.palette.background.paper,
      backdropFilter: 'blur(12px)',
      border: `1px solid ${theme.palette.divider}`,
      overflow: 'hidden',
      marginBottom: theme.spacing(3),
    },
    cardHeader: {
      padding: '18px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      [theme.breakpoints.down('sm')]: {
        padding: '14px 14px',
        gap: '10px',
      },
    },
    iconBox: {
      width: 40,
      height: 40,
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    cardTitle: {
      fontWeight: 700,
      fontSize: '0.95rem',
      color: theme.palette.text.primary,
      [theme.breakpoints.down('sm')]: { fontSize: '0.88rem' },
    },
    cardSubtitle: {
      color: theme.palette.text.disabled,
      fontSize: '0.78rem',
      [theme.breakpoints.down('sm')]: { fontSize: '0.72rem' },
    },
    cardContent: { padding: '24px', [theme.breakpoints.down('sm')]: { padding: '14px' } },
    label: {
      fontSize: '0.82rem',
      fontWeight: 600,
      color: theme.palette.text.secondary,
      marginBottom: '6px',
      display: 'block',
    },
    detailRow: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px 0',
      gap: '12px',
      borderBottom: `1px solid ${theme.palette.divider}`,
      '&:last-child': { borderBottom: 'none' },
    },
    detailLabel: {
      color: theme.palette.text.disabled,
      fontSize: '0.82rem',
      width: '80px',
      flexShrink: 0,
      [theme.breakpoints.down('sm')]: { width: '70px', fontSize: '0.76rem' },
    },
    detailValue: {
      color: theme.palette.text.primary,
      fontSize: '0.82rem',
      fontWeight: 600,
      wordBreak: 'break-all',
    },
  };
});

const SettingsPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const tt = (key, fallback) => {
    const value = t(key);
    return value === key ? fallback : value;
  };
  const { languages, language, setLocalLanguage } = useLocalization();
  const user = useSelector((state) => state.session.user);

  const darkInput = {
    '& .MuiOutlinedInput-root': {
      borderRadius: theme.spacing(1.25),
      backgroundColor: isDark
        ? alpha(theme.palette.common.white, 0.06)
        : theme.palette.action.hover,
      color: theme.palette.text.primary,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': { borderColor: theme.palette.action.selected },
      '&.Mui-focused fieldset': { borderColor: theme.palette.primary.main },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.disabled },
    '& .MuiInputLabel-root.Mui-focused': { color: theme.palette.primary.main },
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const nameParts = user?.name?.split(' ') || [];
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: user?.phone || '',
  });

  const [selectedLanguage, setSelectedLanguage] = useState(language || 'fr');

  const handleProfileUpdate = useCatch(async () => {
    const updatedUser = {
      ...user,
      name: `${profileData.firstName} ${profileData.lastName}`.trim(),
      phone: profileData.phone,
    };
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });
    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
      setSnackbar({ open: true, message: t('sharedSaved'), severity: 'success' });
    }
  });

  const handleLanguageChange = useCatch(async (langCode) => {
    setSelectedLanguage(langCode);
    setLocalLanguage(langCode);
    const updatedUser = {
      ...user,
      attributes: {
        ...(user?.attributes || {}),
        language: langCode,
      },
    };
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });
    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
      setSnackbar({ open: true, message: t('sharedSaved'), severity: 'success' });
    }
  });

  const LANGUAGES = useMemo(
    () =>
      ['ar', 'fr', 'en']
        .map((code) => {
          const value = languages[code];
          if (!value) return null;
          return { code, label: value.name, country: value.country };
        })
        .filter(Boolean),
    [languages],
  );

  const accountDetails = [
    { icon: <EmailOutlined />, label: t('userEmail'), value: user?.email || '' },
    { icon: <PersonOutlined />, label: t('sharedName'), value: user?.name || '' },
    { icon: <PhoneOutlined />, label: t('sharedPhone'), value: user?.phone || '-' },
  ];

  return (
    <PageLayout>
      <Box className={classes.root}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 3 } }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              mr: 1.5,
              color: theme.palette.text.secondary,
              bgcolor: theme.palette.action.hover,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '10px',
            }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography
              sx={{
                fontSize: { xs: '1.05rem', md: '1.25rem' },
                fontWeight: 800,
                color: 'text.primary',
              }}
            >
              {tt('settingsTitle', 'Settings')}
            </Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem' }}>
              {tt('sharedPreferences', 'Preferences')}
            </Typography>
          </Box>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
            gap: { xs: 2, md: 3 },
            width: '100%',
            alignItems: 'flex-start',
          }}
        >
          {/* LEFT COLUMN */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            {/* Profile Info Section */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box
                  className={classes.iconBox}
                  sx={{
                    bgcolor: alpha(theme.palette.info.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                  }}
                >
                  <PersonOutlined sx={{ color: theme.palette.info.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>
                    {tt('settingsUser', 'Account')}
                  </Typography>
                  <Typography className={classes.cardSubtitle}>
                    {tt('sharedPreferences', 'Preferences')}
                  </Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                    gap: 3,
                    mb: 3,
                  }}
                >
                  <Box sx={{ flex: 1 }}>
                    <Typography className={classes.label}>
                      {tt('sharedFirstName', 'First Name')}
                    </Typography>
                    <TextField
                      fullWidth
                      value={profileData.firstName}
                      onChange={(e) =>
                        setProfileData({ ...profileData, firstName: e.target.value })
                      }
                      sx={darkInput}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography className={classes.label}>
                      {tt('sharedLastName', 'Last Name')}
                    </Typography>
                    <TextField
                      fullWidth
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      sx={darkInput}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography className={classes.label}>{tt('sharedPhone', 'Phone')}</Typography>
                  <TextField
                    fullWidth
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    sx={darkInput}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Check />}
                    onClick={handleProfileUpdate}
                    sx={{
                      bgcolor: theme.palette.primary.main,
                      borderRadius: '10px',
                      fontWeight: 700,
                      textTransform: 'none',
                    }}
                  >
                    {tt('sharedSave', 'Save')}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* RIGHT COLUMN */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Language Selection Section */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box
                  className={classes.iconBox}
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                  }}
                >
                  <TranslateOutlined sx={{ color: theme.palette.secondary.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>
                    {tt('loginLanguage', 'Language')}
                  </Typography>
                  <Typography className={classes.cardSubtitle}>
                    {tt('sharedPreferences', 'Preferences')}
                  </Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Language sx={{ fontSize: 17, color: 'text.disabled' }} />
                  <Typography
                    sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}
                  >
                    {tt('loginLanguage', 'Language')}
                  </Typography>
                </Stack>
                <TextField
                  select
                  fullWidth
                  value={selectedLanguage}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  sx={darkInput}
                  size="small"
                >
                  {LANGUAGES.map(({ code, label, country }) => (
                    <MenuItem key={code} value={code}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ReactCountryFlag
                          countryCode={country}
                          svg
                          style={{ width: '1.1em', height: '1.1em' }}
                        />
                        <span>{label}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <Typography sx={{ color: 'text.disabled', fontSize: '0.73rem' }}>
                  {tt('sharedPreferences', 'Preferences')}
                </Typography>
              </Box>
            </Box>

            {/* Account Details Section */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box
                  className={classes.iconBox}
                  sx={{
                    bgcolor: alpha(theme.palette.warning.main, 0.12),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
                  }}
                >
                  <InfoOutlined sx={{ color: theme.palette.warning.main, fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>
                    {tt('settingsUser', 'Account')}
                  </Typography>
                  <Typography className={classes.cardSubtitle}>
                    {tt('sharedInfoTitle', 'Info')}
                  </Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                {accountDetails.map((row, i) => (
                  <Box key={i} className={classes.detailRow}>
                    <Box sx={{ color: 'text.disabled', display: 'flex', fontSize: 18 }}>
                      {row.icon}
                    </Box>
                    <span className={classes.detailLabel}>{row.label}</span>
                    <span className={classes.detailValue}>{row.value}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: '12px' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default SettingsPage;
