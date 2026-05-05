import { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, MenuItem, Select,
  FormControl, Stack, IconButton, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import {
  ArrowBack, Check, Language, EmailOutlined, PhoneOutlined,
  PersonOutlined, TranslateOutlined, InfoOutlined,
  DirectionsCarOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from '../store';
import { useCatch } from '../reactHelper';
import { useTranslation, useLocalization } from '../common/components/LocalizationProvider';
import PageLayout from './PageLayout';

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
      background: theme.palette.background.default,
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    },
    sectionCard: {
      borderRadius: '16px',
      background: isDark ? 'rgba(255,255,255,0.05)' : theme.palette.background.paper,
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
    cardTitle: { fontWeight: 700, fontSize: '0.95rem', color: theme.palette.text.primary, [theme.breakpoints.down('sm')]: { fontSize: '0.88rem' } },
    cardSubtitle: { color: theme.palette.text.disabled, fontSize: '0.78rem', [theme.breakpoints.down('sm')]: { fontSize: '0.72rem' } },
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
    detailLabel: { color: theme.palette.text.disabled, fontSize: '0.82rem', width: '80px', flexShrink: 0, [theme.breakpoints.down('sm')]: { width: '70px', fontSize: '0.76rem' } },
    detailValue: { color: theme.palette.text.primary, fontSize: '0.82rem', fontWeight: 600, wordBreak: 'break-all' },
  };
});

const SettingsPage = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { language, setLanguage } = useLocalization();
  const user = useSelector((state) => state.session.user);

  const darkInput = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '10px',
      background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
      color: theme.palette.text.primary,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': { borderColor: theme.palette.action.selected },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: theme.palette.text.disabled },
    '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
  };

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [vehicleData, setVehicleData] = useState({ name: '', uniqueId: '', model: '' });
  const [loadingDevices, setLoadingDevices] = useState(false);

  const nameParts = user?.name?.split(' ') || [];
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: user?.phone || '',
  });

  const [selectedLanguage, setSelectedLanguage] = useState(language || 'fr');

  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      try {
        const response = await fetch('/api/devices');
        if (response.ok) setDevices(await response.json());
      } catch (e) {
        console.error('Failed to fetch devices', e);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  const handleDeviceSelect = (id) => {
    setSelectedDeviceId(id);
    const device = devices.find((d) => d.id === id);
    if (device) {
      setVehicleData({ name: device.name || '', uniqueId: device.uniqueId || '', model: device.model || '' });
    }
  };

  const handleVehicleUpdate = useCatch(async () => {
    const device = devices.find((d) => d.id === selectedDeviceId);
    const updatedDevice = { ...device, ...vehicleData };
    const response = await fetch(`/api/devices/${selectedDeviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice),
    });
    if (response.ok) {
      setDevices(devices.map((d) => (d.id === selectedDeviceId ? updatedDevice : d)));
      setSnackbar({ open: true, message: t('sharedSaved'), severity: 'success' });
    } else {
      setSnackbar({ open: true, message: t('sharedError'), severity: 'error' });
    }
  });

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

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
  };

  const LANGUAGES = [
    { code: 'en', label: '🇺🇸 English' },
    { code: 'fr', label: '🇫🇷 Français' },
    { code: 'ar', label: '🇸🇦 العربية' },
  ];

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
            <Typography sx={{ fontSize: { xs: '1.05rem', md: '1.25rem' }, fontWeight: 800, color: 'text.primary' }}>{t('settingsTitle')}</Typography>
            <Typography sx={{ color: 'text.disabled', fontSize: '0.82rem' }}>{t('sharedPreferences')}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: { xs: 2, md: 3 }, width: '100%', alignItems: 'flex-start' }}>
          {/* LEFT COLUMN */}
          <Box sx={{ flex: 2, minWidth: 0 }}>
            {/* Vehicle Selection & Edit Card */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box className={classes.iconBox} sx={{ bgcolor: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <DirectionsCarOutlined sx={{ color: '#0ea5e9', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('deviceEdit')}</Typography>
                  <Typography className={classes.cardSubtitle}>Sélectionner et modifier un véhicule</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Typography className={classes.label}>Choisir un véhicule</Typography>
                <FormControl fullWidth sx={{ mb: selectedDeviceId ? 3 : 0 }}>
                  <Select
                    value={selectedDeviceId}
                    onChange={(e) => handleDeviceSelect(e.target.value)}
                    displayEmpty
                    sx={{
                      background: isDark ? 'rgba(255,255,255,0.06)' : theme.palette.action.hover,
                      borderRadius: '10px',
                      color: theme.palette.text.primary,
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                      '& .MuiSvgIcon-root': { color: theme.palette.text.disabled },
                    }}
                  >
                    <MenuItem value="" disabled>
                      {loadingDevices ? <CircularProgress size={20} /> : 'Choisissez un véhicule à modifier...'}
                    </MenuItem>
                    {devices.map((device) => (
                      <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedDeviceId && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography className={classes.label}>Nom du véhicule</Typography>
                        <TextField fullWidth value={vehicleData.name} onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })} sx={darkInput} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography className={classes.label}>Identifiant Unique (IMEI)</Typography>
                        <TextField fullWidth value={vehicleData.uniqueId} onChange={(e) => setVehicleData({ ...vehicleData, uniqueId: e.target.value })} sx={darkInput} />
                      </Box>
                    </Box>
                    <Box>
                      <Typography className={classes.label}>Modèle</Typography>
                      <TextField fullWidth value={vehicleData.model} onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })} sx={darkInput} />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" startIcon={<Check />} onClick={handleVehicleUpdate}
                        sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                        Mettre à jour le véhicule
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Box>
            </Box>

            {/* Profile Info Section */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box className={classes.iconBox} sx={{ bgcolor: 'rgba(14,165,233,0.12)', border: '1px solid rgba(14,165,233,0.2)' }}>
                  <PersonOutlined sx={{ color: '#0ea5e9', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('settingsUser')}</Typography>
                  <Typography className={classes.cardSubtitle}>Mettez à jour vos informations personnelles</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3, mb: 3 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography className={classes.label}>Prénom</Typography>
                    <TextField fullWidth value={profileData.firstName} onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })} sx={darkInput} />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography className={classes.label}>Nom de famille</Typography>
                    <TextField fullWidth value={profileData.lastName} onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })} sx={darkInput} />
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography className={classes.label}>{t('sharedPhone')}</Typography>
                  <TextField fullWidth value={profileData.phone} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} sx={darkInput} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button variant="contained" startIcon={<Check />} onClick={handleProfileUpdate}
                    sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                    Mettre à jour le profil
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
                <Box className={classes.iconBox} sx={{ bgcolor: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <TranslateOutlined sx={{ color: '#22c55e', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>Préférences</Typography>
                  <Typography className={classes.cardSubtitle}>Personnalisez votre expérience</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Language sx={{ fontSize: 17, color: 'text.disabled' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'text.secondary' }}>Langue</Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  {LANGUAGES.map(({ code, label }) => {
                    const selected = selectedLanguage === code;
                    return (
                      <Button
                        key={code}
                        onClick={() => handleLanguageChange(code)}
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          padding: '6px 14px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          border: `1px solid ${selected ? '#6366f1' : theme.palette.divider}`,
                          bgcolor: selected ? 'rgba(99,102,241,0.15)' : theme.palette.action.hover,
                          color: selected ? '#818cf8' : theme.palette.text.secondary,
                          '&:hover': { bgcolor: selected ? 'rgba(99,102,241,0.2)' : theme.palette.action.selected },
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Stack>
                <Typography sx={{ color: 'text.disabled', fontSize: '0.73rem' }}>
                  Sélectionnez votre langue préférée. Les modifications prendront effet immédiatement.
                </Typography>
              </Box>
            </Box>

            {/* Account Details Section */}
            <Box className={classes.sectionCard}>
              <Box className={classes.cardHeader}>
                <Box className={classes.iconBox} sx={{ bgcolor: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <InfoOutlined sx={{ color: '#f59e0b', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>Compte</Typography>
                  <Typography className={classes.cardSubtitle}>Détails du compte</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                {accountDetails.map((row, i) => (
                  <Box key={i} className={classes.detailRow}>
                    <Box sx={{ color: 'text.disabled', display: 'flex', fontSize: 18 }}>{row.icon}</Box>
                    <span className={classes.detailLabel}>{row.label}</span>
                    <span className={classes.detailValue}>{row.value}</span>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar((s) => ({ ...s, open: false }))} severity={snackbar.severity} sx={{ width: '100%', borderRadius: '12px' }} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default SettingsPage;
