import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Button, MenuItem, Select,
  FormControl, Stack, IconButton, Snackbar, Alert, CircularProgress,
  Avatar, Paper, Divider
} from '@mui/material';
import {
  ArrowBack, Check, Language, EmailOutlined, PhoneOutlined,
  PersonOutlined, DescriptionOutlined, TranslateOutlined, InfoOutlined,
  DirectionsCarOutlined
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { sessionActions } from '../store';
import { useCatch } from '../reactHelper';
import { useTranslation, useLocalization } from '../common/components/LocalizationProvider';
import PageLayout from './PageLayout';

const useStyles = makeStyles()((theme) => ({
  root: {
    width: '100%',
    flex: 1,
    boxSizing: 'border-box',
    padding: theme.spacing(3),
    background: '#080d1a',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  sectionCard: {
    borderRadius: '16px',
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: theme.spacing(3),
  },
  cardHeader: {
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
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
  cardTitle: { fontWeight: 700, fontSize: '0.95rem', color: '#f1f5f9' },
  cardSubtitle: { color: '#475569', fontSize: '0.78rem' },
  cardContent: { padding: '24px' },
  label: {
    fontSize: '0.82rem',
    fontWeight: 600,
    color: '#94a3b8',
    marginBottom: '6px',
    display: 'block',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    '&:last-child': { borderBottom: 'none' },
  },
  detailLabel: { color: '#475569', fontSize: '0.82rem', width: '80px', flexShrink: 0 },
  detailValue: { color: '#e2e8f0', fontSize: '0.82rem', fontWeight: 600, wordBreak: 'break-all' },
}));

const darkInput = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.06)',
    color: '#f1f5f9',
    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1' },
  },
  '& .MuiInputLabel-root': { color: '#475569' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#818cf8' },
};

const SettingsPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { language, setLanguage } = useLocalization();
  const user = useSelector((state) => state.session.user);

  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // --- VEHICLE STATE ---
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [vehicleData, setVehicleData] = useState({ name: '', uniqueId: '', model: '' });
  const [loadingDevices, setLoadingDevices] = useState(false);

  // --- PROFILE STATE[cite: 5] ---
  const nameParts = user?.name?.split(' ') || [];
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: user?.phone || '',
  });

  const [selectedLanguage, setSelectedLanguage] = useState(language || 'fr');

  // Fetch Devices for the Selection Dropdown
  useEffect(() => {
    const fetchDevices = async () => {
      setLoadingDevices(true);
      try {
        const response = await fetch('/api/devices');
        if (response.ok) {
          setDevices(await response.json());
        }
      } catch (e) {
        console.error("Failed to fetch devices", e);
      } finally {
        setLoadingDevices(false);
      }
    };
    fetchDevices();
  }, []);

  const handleDeviceSelect = (id) => {
    setSelectedDeviceId(id);
    const device = devices.find(d => d.id === id);
    if (device) {
      setVehicleData({
        name: device.name || '',
        uniqueId: device.uniqueId || '',
        model: device.model || '',
      });
    }
  };

  const handleVehicleUpdate = useCatch(async () => {
    const device = devices.find(d => d.id === selectedDeviceId);
    const updatedDevice = { ...device, ...vehicleData };

    const response = await fetch(`/api/devices/${selectedDeviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedDevice),
    });

    if (response.ok) {
      setDevices(devices.map(d => d.id === selectedDeviceId ? updatedDevice : d));
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{ mr: 1.5, color: '#94a3b8', bgcolor: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px' }}
          >
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#f1f5f9' }}>{t('settingsTitle')}</Typography>
            <Typography sx={{ color: '#475569', fontSize: '0.82rem' }}>{t('sharedPreferences')}</Typography>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', gap: 3, width: '100%', alignItems: 'flex-start' }}>
          {/* LEFT COLUMN: VEHICLE & PROFILE[cite: 5] */}
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
                      background: 'rgba(255,255,255,0.06)',
                      borderRadius: '10px',
                      color: '#f1f5f9',
                      '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' },
                      '& .MuiSvgIcon-root': { color: '#475569' },
                    }}
                  >
                    <MenuItem value="" disabled>{loadingDevices ? <CircularProgress size={20} /> : 'Choisissez un véhicule à modifier...'}</MenuItem>
                    {devices.map((device) => (
                      <MenuItem key={device.id} value={device.id}>{device.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedDeviceId && (
                  <Stack spacing={3}>
                    <Box sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography className={classes.label}>Nom du véhicule</Typography>
                        <TextField
                          fullWidth
                          value={vehicleData.name}
                          onChange={(e) => setVehicleData({ ...vehicleData, name: e.target.value })}
                          sx={darkInput}
                        />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography className={classes.label}>Identifiant Unique (IMEI)</Typography>
                        <TextField
                          fullWidth
                          value={vehicleData.uniqueId}
                          onChange={(e) => setVehicleData({ ...vehicleData, uniqueId: e.target.value })}
                          sx={darkInput}
                        />
                      </Box>
                    </Box>
                    <Box>
                      <Typography className={classes.label}>Modèle</Typography>
                      <TextField
                        fullWidth
                        value={vehicleData.model}
                        onChange={(e) => setVehicleData({ ...vehicleData, model: e.target.value })}
                        sx={darkInput}
                      />
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Button variant="contained" startIcon={<Check />} onClick={handleVehicleUpdate} sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                        Mettre à jour le véhicule
                      </Button>
                    </Box>
                  </Stack>
                )}
              </Box>
            </Box>

            {/* Profile Info Section[cite: 5] */}
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
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
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
                  <Button variant="contained" startIcon={<Check />} onClick={handleProfileUpdate} sx={{ bgcolor: '#6366f1', borderRadius: '10px', fontWeight: 700, textTransform: 'none' }}>
                    Mettre à jour le profil
                  </Button>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* RIGHT COLUMN: LANGUAGE & ACCOUNT[cite: 5] */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {/* Language Selection Section[cite: 5] */}
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
                  <Language sx={{ fontSize: 17, color: '#475569' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#94a3b8' }}>Langue</Typography>
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
                          border: `1px solid ${selected ? '#6366f1' : 'rgba(255,255,255,0.1)'}`,
                          bgcolor: selected ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
                          color: selected ? '#818cf8' : '#94a3b8',
                          '&:hover': { bgcolor: selected ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.08)' },
                        }}
                      >
                        {label}
                      </Button>
                    );
                  })}
                </Stack>
                <Typography sx={{ color: '#475569', fontSize: '0.73rem' }}>
                  Sélectionnez votre langue préférée. Les modifications prendront effet immédiatement.
                </Typography>
              </Box>
            </Box>

            {/* Account Details Section[cite: 5] */}
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
                    <Box sx={{ color: '#475569', display: 'flex', fontSize: 18 }}>{row.icon}</Box>
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