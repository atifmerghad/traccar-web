import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  OutlinedInput,
  InputAdornment,
  IconButton,
  Snackbar,
  Alert,
  Tooltip,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  TuneOutlined,
  MapOutlined,
  PaletteOutlined,
  DarkModeOutlined,
  LightModeOutlined,
  SettingsBrightnessOutlined,
  DirectionsCarOutlined,
  VolumeUpOutlined,
  VpnKeyOutlined,
  ContentCopy,
  RefreshOutlined,
} from '@mui/icons-material';
import { alpha, useTheme } from '@mui/material/styles';
import PageLayout from '../layout/PageLayout';
import { sessionActions } from '../../store';
import { useTranslation } from '../../common/components/LocalizationProvider';
import { useSystemStyles, PageHeader, Section, BottomBar } from './_shared.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const splitCsv = (s, fallback = []) =>
  typeof s === 'string' && s.length > 0 ? s.split(',') : fallback;

const POSITION_FIELD_KEYS = {
  fixTime: 'positionFixTime',
  address: 'positionAddress',
  speed: 'positionSpeed',
  totalDistance: 'positionDistance',
  altitude: 'positionAltitude',
  course: 'positionCourse',
  battery: 'positionBattery',
  ignition: 'positionIgnition',
  odometer: 'positionOdometer',
  fuel: 'positionFuel',
  temperature: 'positionTemp',
  driverUniqueId: 'sharedDriver',
};

const DEVICE_FIELD_KEYS = {
  name: 'sharedName',
  uniqueId: 'deviceIdentifier',
  phone: 'sharedPhone',
  model: 'deviceModel',
  contact: 'deviceContact',
};

const alarmL10nKey = (k) => {
  if (k === 'lowspeed') return 'alarmLowspeed';
  return `alarm${k.charAt(0).toUpperCase()}${k.slice(1)}`;
};

const PreferencesPageV2 = () => {
  const theme = useTheme();
  const { classes } = useSystemStyles();
  const t = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const user = useSelector((s) => s.session?.user);
  const socket = useSelector((s) => s.session?.socket);
  const versionServer = useSelector((s) => s.session?.server?.version);
  const versionApp = import.meta.env.VITE_APP_VERSION;

  const [attributes, setAttributes] = useState(user?.attributes || {});
  const [eventTypes, setEventTypes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const [tokenExpiration, setTokenExpiration] = useState(
    dayjs().add(1, 'week').locale('en').format('YYYY-MM-DD'),
  );
  const [token, setToken] = useState('');

  useEffect(() => {
    setAttributes(user?.attributes || {});
  }, [user]);

  useEffect(() => {
    let active = true;
    fetch('/api/notifications/types').then(async (r) => {
      if (!r.ok) return;
      const list = await r.json();
      if (active) setEventTypes(Array.isArray(list) ? list : []);
    });
    return () => {
      active = false;
    };
  }, []);

  // Common alarm types (mirrors Traccar locale alarm.* keys but kept short)
  const alarmKeys = useMemo(
    () => [
      'general',
      'sos',
      'vibration',
      'movement',
      'lowspeed',
      'overspeed',
      'fallDown',
      'lowPower',
      'lowBattery',
      'fault',
      'powerOff',
      'powerOn',
      'door',
      'lock',
      'unlock',
      'geofence',
      'geofenceEnter',
      'geofenceExit',
      'gpsAntennaCut',
      'accident',
      'tow',
      'idle',
      'highRpm',
      'hardAcceleration',
      'hardBraking',
      'hardCornering',
      'laneChange',
      'fatigueDriving',
      'powerCut',
      'powerRestored',
      'jamming',
      'temperature',
      'parking',
      'shock',
      'bonnet',
      'footBrake',
      'fuelLeak',
      'tampering',
      'removing',
    ],
    [],
  );

  // ── Map preferences ─────────────────────────────────────────────────────────

  const setAttr = (k, v) => setAttributes((a) => ({ ...a, [k]: v }));

  // ── Save ────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...user, attributes }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      dispatch(sessionActions.updateUser(updated));
      setSnack({ open: true, msg: t('preferencesSaveSuccess'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('preferencesSaveFailed'), severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // ── Token ───────────────────────────────────────────────────────────────────

  const generateToken = async () => {
    try {
      const expiration = dayjs(tokenExpiration, 'YYYY-MM-DD').toISOString();
      const res = await fetch('/api/session/token', {
        method: 'POST',
        body: new URLSearchParams(`expiration=${expiration}`),
      });
      if (!res.ok) throw new Error();
      setToken(await res.text());
    } catch {
      setSnack({ open: true, msg: t('preferencesTokenGenerateFailed'), severity: 'error' });
    }
  };

  const copyToken = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setSnack({ open: true, msg: t('preferencesTokenCopied'), severity: 'success' });
    } catch {
      setSnack({ open: true, msg: t('preferencesTokenCopyFailed'), severity: 'error' });
    }
  };

  if (!user)
    return (
      <PageLayout>
        <Box className={classes.root} />
      </PageLayout>
    );

  const positionFieldLabel = (k) => {
    const lk = POSITION_FIELD_KEYS[k];
    return lk ? t(lk) : k;
  };
  const deviceFieldLabel = (k) => {
    const lk = DEVICE_FIELD_KEYS[k];
    return lk ? t(lk) : k;
  };
  const alarmLabel = (k) => t(alarmL10nKey(k));

  const positionItems = splitCsv(attributes.positionItems, [
    'fixTime',
    'address',
    'speed',
    'totalDistance',
  ]);
  const soundEvents = splitCsv(attributes.soundEvents);
  const soundAlarms = splitCsv(attributes.soundAlarms, ['sos']);

  return (
    <PageLayout>
      <Box className={classes.root}>
        <PageHeader
          icon={<TuneOutlined sx={{ color: theme.palette.primary.main }} />}
          title={t('sharedPreferences')}
          subtitle={t('preferencesPageSubtitle')}
          classes={classes}
        />

        <Box className={classes.container}>
          <Section
            icon={<PaletteOutlined fontSize="small" />}
            title={t('preferencesSectionAppearance')}
            hint={t('preferencesSectionAppearanceHint')}
            classes={classes}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={
                  attributes.darkMode === true
                    ? 'dark'
                    : attributes.darkMode === false
                      ? 'light'
                      : 'system'
                }
                onChange={(_, val) => {
                  if (!val) return;
                  setAttributes((a) => {
                    const next = { ...a };
                    if (val === 'system') delete next.darkMode;
                    else next.darkMode = val === 'dark';
                    return next;
                  });
                }}
                sx={{
                  '& .MuiToggleButton-root': {
                    textTransform: 'none',
                    borderRadius: 2,
                    px: 2,
                    gap: 0.75,
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.18),
                      color: theme.palette.primary.main,
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.24) },
                    },
                  },
                }}
              >
                <ToggleButton value="light">
                  <LightModeOutlined fontSize="small" /> Clair
                </ToggleButton>
                <ToggleButton value="dark">
                  <DarkModeOutlined fontSize="small" /> Sombre
                </ToggleButton>
                <ToggleButton value="system">
                  <SettingsBrightnessOutlined fontSize="small" /> Système
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>
                {attributes.darkMode === undefined
                  ? t('preferencesThemeHintSystem')
                  : attributes.darkMode
                    ? t('preferencesThemeHintDark')
                    : t('preferencesThemeHintLight')}
              </Typography>
            </Box>
          </Section>

          <Section icon={<MapOutlined fontSize="small" />} title={t('mapTitle')} classes={classes}>
            <Box className={classes.formRow2}>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('mapLiveRoutes')}</InputLabel>
                <Select
                  label={t('mapLiveRoutes')}
                  value={attributes.mapLiveRoutes || 'none'}
                  onChange={(e) => setAttr('mapLiveRoutes', e.target.value)}
                >
                  <MenuItem value="none">{t('mapRoutesNone')}</MenuItem>
                  <MenuItem value="selected">{t('mapRoutesSelected')}</MenuItem>
                  <MenuItem value="all">{t('mapRoutesAll')}</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('mapDirection')}</InputLabel>
                <Select
                  label={t('mapDirection')}
                  value={attributes.mapDirection || 'selected'}
                  onChange={(e) => setAttr('mapDirection', e.target.value)}
                >
                  <MenuItem value="none">{t('mapDirectionNone')}</MenuItem>
                  <MenuItem value="selected">{t('mapDirectionSelected')}</MenuItem>
                  <MenuItem value="all">{t('mapDirectionAll')}</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <FormControl size="small" className={classes.inputDark}>
              <InputLabel>{t('preferencesPositionInfoLabel')}</InputLabel>
              <Select
                multiple
                label={t('preferencesPositionInfoLabel')}
                value={positionItems}
                onChange={(e) => setAttr('positionItems', e.target.value.join(','))}
                renderValue={(sel) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sel.map((v) => (
                      <Chip
                        size="small"
                        key={v}
                        label={positionFieldLabel(v)}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {[
                  'fixTime',
                  'address',
                  'speed',
                  'totalDistance',
                  'altitude',
                  'course',
                  'battery',
                  'ignition',
                  'odometer',
                  'fuel',
                  'temperature',
                  'driverUniqueId',
                ].map((k) => (
                  <MenuItem key={k} value={k}>
                    {positionFieldLabel(k)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormGroup row>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={attributes.mapGeofences ?? true}
                    onChange={(e) => setAttr('mapGeofences', e.target.checked)}
                  />
                }
                label={t('attributeShowGeofences')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={attributes.mapFollow ?? false}
                    onChange={(e) => setAttr('mapFollow', e.target.checked)}
                  />
                }
                label={t('preferencesMapFollow')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={attributes.mapCluster ?? true}
                    onChange={(e) => setAttr('mapCluster', e.target.checked)}
                  />
                }
                label={t('mapClustering')}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={attributes.mapOnSelect ?? true}
                    onChange={(e) => setAttr('mapOnSelect', e.target.checked)}
                  />
                }
                label={t('mapOnSelect')}
              />
            </FormGroup>
          </Section>

          <Section
            icon={<DirectionsCarOutlined fontSize="small" />}
            title={t('deviceTitle')}
            hint={t('preferencesDevicesHint')}
            classes={classes}
          >
            <Box className={classes.formRow2}>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('preferencesDevicePrimary')}</InputLabel>
                <Select
                  label={t('preferencesDevicePrimary')}
                  value={attributes.devicePrimary || 'name'}
                  onChange={(e) => setAttr('devicePrimary', e.target.value)}
                >
                  {['name', 'uniqueId', 'phone', 'model', 'contact'].map((k) => (
                    <MenuItem key={k} value={k}>
                      {deviceFieldLabel(k)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" className={classes.inputDark}>
                <InputLabel>{t('preferencesDeviceSecondary')}</InputLabel>
                <Select
                  label={t('preferencesDeviceSecondary')}
                  value={attributes.deviceSecondary || ''}
                  onChange={(e) => setAttr('deviceSecondary', e.target.value)}
                >
                  <MenuItem value="">
                    <em>{t('sharedNone')}</em>
                  </MenuItem>
                  {['name', 'uniqueId', 'phone', 'model', 'contact'].map((k) => (
                    <MenuItem key={k} value={k}>
                      {deviceFieldLabel(k)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Section>

          <Section
            icon={<VolumeUpOutlined fontSize="small" />}
            title={t('preferencesSectionSound')}
            hint={t('preferencesSectionSoundHint')}
            classes={classes}
          >
            <FormControl size="small" className={classes.inputDark}>
              <InputLabel>{t('eventsSoundEvents')}</InputLabel>
              <Select
                multiple
                label={t('eventsSoundEvents')}
                value={soundEvents}
                onChange={(e) => setAttr('soundEvents', e.target.value.join(','))}
                renderValue={(sel) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sel.map((v) => (
                      <Chip
                        size="small"
                        key={v}
                        label={v}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {eventTypes.map((it) => (
                  <MenuItem key={it.type} value={it.type}>
                    {it.type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" className={classes.inputDark}>
              <InputLabel>{t('eventsSoundAlarms')}</InputLabel>
              <Select
                multiple
                label={t('eventsSoundAlarms')}
                value={soundAlarms}
                onChange={(e) => setAttr('soundAlarms', e.target.value.join(','))}
                renderValue={(sel) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {sel.map((v) => (
                      <Chip
                        size="small"
                        key={v}
                        label={alarmLabel(v)}
                        sx={{ height: 22, fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                )}
              >
                {alarmKeys.map((k) => (
                  <MenuItem key={k} value={k}>
                    {alarmLabel(k)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Section>

          <Section
            icon={<VpnKeyOutlined fontSize="small" />}
            title={t('preferencesApiToken')}
            hint={t('preferencesApiTokenHint')}
            classes={classes}
          >
            <Box className={classes.formRow2}>
              <TextField
                size="small"
                type="date"
                label={t('userExpirationTime')}
                InputLabelProps={{ shrink: true }}
                className={classes.inputDark}
                value={tokenExpiration}
                onChange={(e) => {
                  setTokenExpiration(e.target.value);
                  setToken('');
                }}
              />
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Tooltip title={t('preferencesTokenGenerate')}>
                  <IconButton
                    onClick={generateToken}
                    className={classes.iconBtn}
                    disabled={!!token}
                  >
                    <RefreshOutlined fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title={t('sharedCopy')}>
                  <IconButton onClick={copyToken} className={classes.iconBtn} disabled={!token}>
                    <ContentCopy fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <FormControl fullWidth>
              <OutlinedInput
                multiline
                rows={4}
                readOnly
                value={token}
                placeholder={t('preferencesTokenPlaceholder')}
                sx={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', borderRadius: 2 }}
                endAdornment={
                  token ? (
                    <InputAdornment position="end">
                      <IconButton onClick={copyToken} edge="end" size="small">
                        <ContentCopy fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ) : null
                }
              />
            </FormControl>
          </Section>

          <Section
            icon={<TuneOutlined fontSize="small" />}
            title={t('preferencesInfoSection')}
            classes={classes}
          >
            <Box className={classes.formRow3}>
              <TextField
                label={t('preferencesAppVersion')}
                className={classes.inputDark}
                size="small"
                value={versionApp || '—'}
                disabled
              />
              <TextField
                label={t('settingsServerVersion')}
                className={classes.inputDark}
                size="small"
                value={versionServer || '—'}
                disabled
              />
              <TextField
                label={t('sharedConnection')}
                className={classes.inputDark}
                size="small"
                value={socket ? t('sharedOnline') : t('sharedOffline')}
                disabled
              />
            </Box>
          </Section>

          <BottomBar
            onCancel={() => navigate(-1)}
            onSave={handleSave}
            saving={saving}
            classes={classes}
          />
        </Box>

        <Snackbar
          open={snack.open}
          autoHideDuration={3000}
          onClose={() => setSnack({ ...snack, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={snack.severity}
            variant="filled"
            onClose={() => setSnack({ ...snack, open: false })}
            sx={{ borderRadius: 2 }}
          >
            {snack.msg}
          </Alert>
        </Snackbar>
      </Box>
    </PageLayout>
  );
};

export default PreferencesPageV2;
