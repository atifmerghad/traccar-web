import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button,
  MenuItem, Select, FormControl, Stack, IconButton, Avatar,
  Snackbar, Alert // Added imports here
} from '@mui/material';
import {
  ArrowBack, Check, Language, EmailOutlined, PhoneOutlined,
  PersonOutlined, DescriptionOutlined, TranslateOutlined, InfoOutlined
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
    backgroundColor: '#f1f5f9',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },

  // Section cards — same as dashboard
  sectionCard: {
    borderRadius: '16px',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
    overflow: 'hidden',
    marginBottom: theme.spacing(3),
  },

  cardHeader: {
    padding: '20px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerBlue: { background: 'linear-gradient(90deg, #f0f9ff 0%, #ffffff 100%)' },
  headerGreen: { background: 'linear-gradient(90deg, #f0fdf4 0%, #ffffff 100%)' },
  headerYellow: { background: 'linear-gradient(90deg, #fffbeb 0%, #ffffff 100%)' },

  iconBox: {
    width: 40,
    height: 40,
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardTitle: { fontWeight: 700, fontSize: '1rem', color: '#1e293b' },
  cardSubtitle: { color: '#64748b', fontSize: '0.8rem' },
  cardContent: { padding: '24px' },

  // Form
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: '#475569',
    marginBottom: '6px',
    display: 'block',
  },
  textField: {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px',
      backgroundColor: '#fff',
      '& fieldset': { borderColor: '#e2e8f0' },
      '&:hover fieldset': { borderColor: '#cbd5e1' },
    },
  },

  // Language buttons
  langButton: {
    borderRadius: '8px',
    textTransform: 'none',
    padding: '8px 16px',
    fontSize: '0.8rem',
    fontWeight: 500,
    border: '1px solid #e2e8f0',
    color: '#64748b',
    '&.selected': {
      backgroundColor: '#6366f1',
      color: '#fff',
      borderColor: '#6366f1',
    },
  },

  // Account detail rows
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 0',
    gap: '12px',
    borderBottom: '1px solid #f1f5f9',
    '&:last-child': { borderBottom: 'none' },
  },
  detailLabel: { color: '#64748b', fontSize: '0.85rem', width: '80px', flexShrink: 0 },
  detailValue: { color: '#1e293b', fontSize: '0.85rem', fontWeight: 600 },

  saveBtn: {
    backgroundColor: '#6366f1',
    borderRadius: '8px',
    textTransform: 'none',
    padding: '10px 24px',
    fontWeight: 600,
    '&:hover': { backgroundColor: '#4f46e5' },
  },
}));

const SettingsPage = () => {
  const { classes } = useStyles();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { language, setLanguage } = useLocalization();
  const user = useSelector((state) => state.session.user);

  // --- Snackbar State ---
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success', // 'success' | 'error' | 'info' | 'warning'
  });

  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    if (language === 'en' || language === 'fr' || language === 'ar') return language;
    return 'fr';
  });

  const nameParts = user?.name?.split(' ') || [];
  const [profileData, setProfileData] = useState({
    firstName: nameParts[0] || '',
    lastName: nameParts.slice(1).join(' ') || '',
    phone: user?.phone || '',
  });

  useEffect(() => {
    const parts = user?.name?.split(' ') || [];
    setProfileData({
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      phone: user?.phone || '',
    });
  }, [user]);

  useEffect(() => {
    if (language === 'en' || language === 'fr' || language === 'ar') {
      setSelectedLanguage(language);
    }
  }, [language]);

  const handleLanguageChange = (langCode) => {
    setSelectedLanguage(langCode);
    setLanguage(langCode);
  };

  // --- Close handler for Snackbar ---
  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const handleProfileUpdate = useCatch(async () => {
    const updatedName = `${profileData.firstName} ${profileData.lastName}`.trim();
    const updatedUser = { ...user, name: updatedName, phone: profileData.phone };
    const response = await fetch(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedUser),
    });

    if (response.ok) {
      dispatch(sessionActions.updateUser(await response.json()));
      // Trigger success snackbar
      setSnackbar({
        open: true,
        message: t('sharedSaved') || 'Profile updated successfully!',
        severity: 'success'
      });
    } else {
      // Trigger error snackbar
      setSnackbar({
        open: true,
        message: t('sharedError') || 'Failed to update profile.',
        severity: 'error'
      });
      throw Error(await response.text());
    }
  });

  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1, bgcolor: '#fff', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
            <ArrowBack />
          </IconButton>
          <Box>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>
              {t('settingsTitle')}
            </Typography>
            <Typography sx={{ color: '#64748b', fontSize: '0.85rem' }}>
              {t('sharedPreferences')}
            </Typography>
          </Box>
        </Box>

        {/* Two-column layout */}
        <Box sx={{ display: 'flex', gap: 3, width: '100%', alignItems: 'flex-start' }}>

          {/* Left column — 2/3 width */}
          <Box sx={{ flex: 2, minWidth: 0 }}>

            {/* Vehicle Selection */}
            <Paper elevation={0} className={classes.sectionCard}>
              <Box className={`${classes.cardHeader} ${classes.headerBlue}`}>
                <Box className={classes.iconBox} sx={{ bgcolor: '#e0f2fe' }}>
                  <DescriptionOutlined sx={{ color: '#0ea5e9' }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('deviceEdit')}</Typography>
                  <Typography className={classes.cardSubtitle}>{t('sharedDescription')}</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Typography className={classes.label}>{t('sharedDevice')}</Typography>
                <FormControl fullWidth>
                  <Select displayEmpty value="" className={classes.textField}>
                    <MenuItem value="" disabled>{t('sharedSearchDevices')}</MenuItem>
                    <MenuItem value="v1">{t('sharedDevice')} 1</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Paper>

            {/* Profile Info */}
            <Paper elevation={0} className={classes.sectionCard}>
              <Box className={`${classes.cardHeader} ${classes.headerBlue}`}>
                <Box className={classes.iconBox} sx={{ bgcolor: '#e0f2fe' }}>
                  <PersonOutlined sx={{ color: '#0ea5e9' }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('settingsUser')}</Typography>
                  <Typography className={classes.cardSubtitle}>{t('sharedPreferences')}</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className={classes.label}>{t('sharedName')}</Typography>
                    <TextField
                      fullWidth
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      className={classes.textField}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography className={classes.label}>{t('sharedName')}</Typography>
                    <TextField
                      fullWidth
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      className={classes.textField}
                    />
                  </Box>
                </Box>
                <Box sx={{ mb: 3 }}>
                  <Typography className={classes.label}>{t('sharedPhone')}</Typography>
                  <TextField
                    fullWidth
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className={classes.textField}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<Check />}
                    className={classes.saveBtn}
                    onClick={handleProfileUpdate}
                    disableElevation
                  >
                    {t('sharedSave')}
                  </Button>
                </Box>
              </Box>
            </Paper>
          </Box>

          {/* Right column — 1/3 width */}
          <Box sx={{ flex: 1, minWidth: 0 }}>

            {/* Language Preferences */}
            <Paper elevation={0} className={classes.sectionCard}>
              <Box className={`${classes.cardHeader} ${classes.headerGreen}`}>
                <Box className={classes.iconBox} sx={{ bgcolor: '#dcfce7' }}>
                  <TranslateOutlined sx={{ color: '#22c55e' }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('sharedPreferences')}</Typography>
                  <Typography className={classes.cardSubtitle}>{t('sharedPreferences')}</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Language sx={{ fontSize: 18, color: '#64748b' }} />
                  <Typography sx={{ fontWeight: 600, fontSize: '0.85rem', color: '#1e293b' }}>
                    {t('sharedPreferences')}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  {[
                    { code: 'en', label: '🇺🇸 English' },
                    { code: 'fr', label: '🇫🇷 Français' },
                    { code: 'ar', label: '🇸🇦 العربية' },
                  ].map(({ code, label }) => (
                    <Button
                      key={code}
                      className={`${classes.langButton} ${selectedLanguage === code ? 'selected' : ''}`}
                      onClick={() => handleLanguageChange(code)}
                    >
                      {label}
                    </Button>
                  ))}
                </Stack>
                <Typography sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                  {t('sharedPreferences')}
                </Typography>
              </Box>
            </Paper>

            {/* Account Details */}
            <Paper elevation={0} className={classes.sectionCard}>
              <Box className={`${classes.cardHeader} ${classes.headerYellow}`}>
                <Box className={classes.iconBox} sx={{ bgcolor: '#fef3c7' }}>
                  <InfoOutlined sx={{ color: '#f59e0b' }} />
                </Box>
                <Box>
                  <Typography className={classes.cardTitle}>{t('settingsUser')}</Typography>
                  <Typography className={classes.cardSubtitle}>{t('settingsUser')}</Typography>
                </Box>
              </Box>
              <Box className={classes.cardContent}>
                {[
                  { icon: <EmailOutlined />, label: t('userEmail'), value: user?.email || '' },
                  { icon: <PersonOutlined />, label: t('sharedName'), value: user?.name || '' },
                  { icon: <PhoneOutlined />, label: t('sharedPhone'), value: user?.phone || '-' },
                ].map((row, i) => (
                  <Box key={i} className={classes.detailRow}>
                    <Box sx={{ color: '#94a3b8', display: 'flex', fontSize: 18 }}>{row.icon}</Box>
                    <span className={classes.detailLabel}>{row.label}</span>
                    <span className={classes.detailValue}>{row.value}</span>
                  </Box>
                ))}
              </Box>
            </Paper>

          </Box>
        </Box>
      </Box>

      {/* --- Snackbar Component Added Here --- */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
          variant="filled"
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

    </PageLayout>
  );
};

export default SettingsPage;