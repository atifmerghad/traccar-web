import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box, Typography, IconButton, Button, Fab, Switch,
  TextField, Select, MenuItem, Slider, Divider, Tooltip,
  Snackbar, Alert, CircularProgress,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import {
  ChevronRight, Close, Share, NotificationsOutlined,
  FmdGoodOutlined, MapOutlined, SettingsRemoteOutlined,
  Speed as SpeedIcon, DirectionsCar, BatteryAlertOutlined,
  PowerOffOutlined, LocalShipping, SportsMotorsports,
  MyLocation, Stop, RestartAlt, LockOpen, VolumeUp, Sms,
  PlayArrow, Refresh, ZoomIn, ZoomOut, MyLocationOutlined,
  HistoryOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import DeviceRow from './DeviceRow';
import MainToolbar from './MainToolbar';
import StatusCardNew from './StatusCardNew';
import PageLayout from './PageLayout';
import MainMap from '../main/MainMap';
import useFilter from '../main/useFilter';
import usePersistedState from '../common/util/usePersistedState';
import { devicesActions, sessionActions } from '../store';
import { useTranslation } from '../common/components/LocalizationProvider';
import { speedFromKnots } from '../common/util/converter';
import { useAttributePreference } from '../common/util/preferences';
import { useEffectAsync } from '../reactHelper';

dayjs.extend(relativeTime);

const useStyles = makeStyles()((theme) => { const isDark = theme.palette.mode === 'dark'; return {
  mainContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    background: theme.palette.background.default,
  },
  mapContainer: {
    position: 'absolute',
    inset: 6,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 24px rgba(0,0,0,0.4)',
  },
  sidebar: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 390,
    height: 'calc(100% - 12px)',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 8,
    overflow: 'hidden',
    background: isDark ? 'rgba(8,13,26,0.97)' : 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${theme.palette.divider}`,
    zIndex: 1000,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
  },
  vehicleList: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(1.5),
    scrollbarWidth: 'thin',
    scrollbarColor: `${theme.palette.action.selected} transparent`,
    '&::-webkit-scrollbar': { width: 4 },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: theme.palette.action.selected, borderRadius: 4 },
  },
  expandFab: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1002,
    width: 36,
    height: 36,
    minHeight: 'unset',
    background: isDark ? 'rgba(8,13,26,0.9)' : 'rgba(255,255,255,0.9)',
    color: theme.palette.text.secondary,
    border: `1px solid ${theme.palette.divider}`,
    boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
  },
  rightToolbar: {
    position: 'absolute',
    top: '50%',
    right: 14,
    transform: 'translateY(-50%)',
    zIndex: 1002,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    background: isDark ? 'rgba(8,13,26,0.95)' : 'rgba(255,255,255,0.95)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 14,
    padding: '10px 7px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  toolbarDivider: { height: 1, background: theme.palette.divider, margin: '4px 0' },
  toolbarBtn: { width: 38, height: 38, borderRadius: '10px !important', color: theme.palette.text.secondary },
  toolbarBtnActive: { background: '#6366f1 !important', color: '#fff !important' },
  panel: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 360,
    height: 'calc(100% - 12px)',
    background: isDark ? 'rgba(8,13,26,0.97)' : 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 12,
    zIndex: 1003,
    boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: `1px solid ${theme.palette.divider}`,
    flexShrink: 0,
  },
  panelTitle: { fontWeight: 800, fontSize: '1.1rem', color: theme.palette.text.primary },
  panelSubtitle: { fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 },
  panelBody: { flex: 1, overflowY: 'auto', padding: '12px 20px' },
  panelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0',
    borderBottom: `1px solid ${theme.palette.divider}`,
    cursor: 'pointer',
  },
  panelRowIcon: { width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  panelRowTitle: { fontWeight: 600, fontSize: '0.9rem', color: theme.palette.text.primary },
  panelRowSub: { fontSize: '0.75rem', color: theme.palette.text.secondary },
  commandGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  commandBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '18px 10px',
    borderRadius: 12,
    border: `1.5px solid ${theme.palette.divider}`,
    background: isDark ? 'rgba(255,255,255,0.03)' : theme.palette.action.hover,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  commandIcon: { width: 50, height: 50, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  mapTypeGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  mapTypeBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    padding: '12px 8px',
    borderRadius: 10,
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 600,
    border: `1.5px solid ${theme.palette.divider}`,
    background: isDark ? 'rgba(255,255,255,0.04)' : theme.palette.background.paper,
    color: theme.palette.text.secondary,
  },
}; });

// ─── Panel: Share ─────────────────────────────────────────────────────────────

const SharePanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const lat = vehicle?.position?.latitude;
  const lng = vehicle?.position?.longitude;
  const openGoogleMaps = () => { if (lat && lng) window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank'); };
  const openWaze = () => { if (lat && lng) window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank'); };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Partager les Données</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {[
          { icon: <MapOutlined />, bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', title: 'Données de Base', sub: 'Plaque, localisation et statut' },
          { icon: <DirectionsCar />, bg: 'rgba(99,102,241,0.15)', color: '#6366f1', title: 'Données Complètes', sub: 'Toutes les informations du véhicule' },
        ].map((item, i) => (
          <Box key={i} className={classes.panelRow}>
            <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
              <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography className={classes.panelRowTitle}>{item.title}</Typography>
              <Typography className={classes.panelRowSub}>{item.sub}</Typography>
            </Box>
            <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
          </Box>
        ))}
        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary', fontWeight: 600, mt: 2, mb: 1 }}>Partager la Localisation</Typography>
        <Box className={classes.panelRow} onClick={openGoogleMaps}>
          <Box className={classes.panelRowIcon} sx={{ bgcolor: 'rgba(245,158,11,0.15)' }}>
            <MyLocation sx={{ color: '#f59e0b' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>Google Maps</Typography>
            <Typography className={classes.panelRowSub}>{lat ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}` : 'Position non disponible'}</Typography>
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
        </Box>
        <Box className={classes.panelRow} onClick={openWaze}>
          <Box className={classes.panelRowIcon} sx={{ bgcolor: 'rgba(16,185,129,0.15)' }}>
            <FmdGoodOutlined sx={{ color: '#10b981' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>Waze</Typography>
            <Typography className={classes.panelRowSub}>Naviguer avec Waze</Typography>
          </Box>
          <Box sx={{ color: 'text.disabled', fontSize: 20 }}>›</Box>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Panel: Alerts ────────────────────────────────────────────────────────────

const AlertsPanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [enabled, setEnabled] = useState({});
  useEffect(() => {
    if (!vehicle?.id) return;
    fetch(`/api/notifications?deviceId=${vehicle.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((notifs) => { const map = {}; notifs.forEach((n) => { map[n.type] = true; }); setEnabled(map); })
      .catch(() => { });
  }, [vehicle?.id]);

  const alerts = [
    { key: 'overspeed', icon: <SpeedIcon />, bg: 'rgba(59,130,246,0.15)', color: '#3b82f6', label: 'Alerte de Vitesse' },
    { key: 'ignitionOn', icon: <DirectionsCar />, bg: 'rgba(34,197,94,0.15)', color: '#22c55e', label: 'Alerte de Démarrage' },
    { key: 'lowBattery', icon: <BatteryAlertOutlined />, bg: 'rgba(245,158,11,0.15)', color: '#f59e0b', label: 'Alerte Batterie Faible' },
    { key: 'deviceOffline', icon: <PowerOffOutlined />, bg: 'rgba(168,85,247,0.15)', color: '#a855f7', label: 'Alerte Hors Ligne' },
    { key: 'alarm', icon: <LocalShipping />, bg: 'rgba(249,115,22,0.15)', color: '#f97316', label: 'Alarme Générale' },
    { key: 'sos', icon: <SportsMotorsports />, bg: 'rgba(236,72,153,0.15)', color: '#ec4899', label: 'Alerte SOS' },
    { key: 'hardBraking', icon: <Stop />, bg: 'rgba(239,68,68,0.15)', color: '#ef4444', label: 'Alerte de Choc' },
    { key: 'geofenceEnter', icon: <FmdGoodOutlined />, bg: 'rgba(16,185,129,0.15)', color: '#10b981', label: 'Entrée Géofence' },
  ];

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Alertes</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {alerts.map((item) => (
          <Box key={item.key} className={classes.panelRow} sx={{ cursor: 'default' }}>
            <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
              <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Typography className={classes.panelRowTitle} sx={{ flex: 1 }}>{item.label}</Typography>
            <Switch size="small" checked={!!enabled[item.key]} onChange={() => setEnabled((p) => ({ ...p, [item.key]: !p[item.key] }))}
              sx={{ '& .Mui-checked': { color: '#6366f1' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: 'rgba(99,102,241,0.4)' } }} />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─── Panel: Geofence ─────────────────────────────────────────────────────────

const GeofencePanel = ({ vehicle, classes, onClose, onSaved }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [radius, setRadius] = useState(0.5);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const lat = vehicle?.position?.latitude ?? 32.2356;
  const lng = vehicle?.position?.longitude ?? -7.9563;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const wkt = `CIRCLE (${lng.toFixed(6)} ${lat.toFixed(6)}, ${Math.round(radius * 1000)})`;
      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, area: wkt, calendarId: 0 }),
      });
      if (res.ok) { onSaved?.(); onClose(); }
    } finally { setSaving(false); }
  };

  const darkInput = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '8px', background: theme.palette.action.hover, color: theme.palette.text.primary,
      '& fieldset': { borderColor: theme.palette.divider },
      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& input::placeholder': { color: '#475569', opacity: 1 },
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Géofences</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Box sx={{ bgcolor: 'rgba(14,165,233,0.1)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: 2, p: 1.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#38bdf8', mb: 0.5 }}>Créer une géofence circulaire</Typography>
          <Typography sx={{ fontSize: '0.77rem', color: '#7dd3fc', lineHeight: 1.6 }}>La géofence sera centrée sur la position actuelle du véhicule.</Typography>
        </Box>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', mb: 0.5 }}>Nom <span style={{ color: '#ef4444' }}>*</span></Typography>
        <TextField fullWidth size="small" placeholder="ex: Maison, Bureau, Zone de livraison" value={name} onChange={(e) => setName(e.target.value)} sx={{ mb: 2.5, ...darkInput }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary' }}>Rayon</Typography>
          <Box sx={{ bgcolor: '#6366f1', color: '#fff', borderRadius: 1, px: 1.5, py: 0.25, fontSize: '0.77rem', fontWeight: 700 }}>{Math.round(radius * 1000)} m</Box>
        </Box>
        <Slider value={radius} min={0.1} max={5} step={0.1} onChange={(_, v) => setRadius(v)} sx={{ color: '#6366f1', mb: 2.5 }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.secondary', mb: 1 }}>📍 Position actuelle</Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4 }}>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>Lat:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>{lat.toFixed(5)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', color: 'text.disabled' }}>Lng:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'text.primary' }}>{lng.toFixed(5)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button fullWidth variant="contained" disableElevation disabled={!name.trim() || saving} onClick={handleSave}
            sx={{ bgcolor: '#6366f1', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#4f46e5' } }}>
            {saving ? '...' : '✓ Enregistrer'}
          </Button>
          <Button fullWidth variant="outlined" onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: theme.palette.divider, color: 'text.secondary', '&:hover': { borderColor: theme.palette.divider, bgcolor: theme.palette.action.hover } }}>
            Annuler
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Panel: Map Settings ──────────────────────────────────────────────────────

const MapSettingsPanel = ({ classes, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [mapType, setMapType] = usePersistedState('mapType', 'hybrid');
  const [autoRefresh, setAutoRefresh] = usePersistedState('autoRefresh', true);
  const [lockCamera, setLockCamera] = usePersistedState('lockCamera', false);
  const [smoothMovement, setSmoothMovement] = usePersistedState('smoothMovement', false);
  const [interval_, setInterval_] = usePersistedState('refreshInterval', '10');

  const MAP_TYPES = [
    { key: 'hybrid', label: 'Hybride', emoji: '🌍' },
    { key: 'satellite', label: 'Satellite', emoji: '🛰️' },
    { key: 'roadmap', label: 'Carte routière', emoji: '🗺️' },
    { key: 'terrain', label: 'Terrain', emoji: '⛰️' },
  ];

  const Setting = ({ label, sub, checked, onChange }) => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.75 }}>
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: 'text.primary' }}>{label}</Typography>
        <Switch size="small" checked={checked} onChange={onChange}
          sx={{ '& .Mui-checked': { color: '#6366f1' }, '& .Mui-checked + .MuiSwitch-track': { bgcolor: 'rgba(99,102,241,0.4)' } }} />
      </Box>
      {sub && <Typography sx={{ fontSize: '0.73rem', color: 'text.secondary', pb: 0.5 }}>{sub}</Typography>}
    </Box>
  );

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Typography className={classes.panelTitle}>Paramètres de la carte</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1.5 }}>Type de carte</Typography>
        <Box className={classes.mapTypeGrid}>
          {MAP_TYPES.map((t) => (
            <Box key={t.key} className={classes.mapTypeBtn} onClick={() => setMapType(t.key)}
              sx={mapType === t.key ? { border: '1.5px solid #6366f1 !important', bgcolor: 'rgba(99,102,241,0.15) !important', color: '#818cf8 !important' } : {}}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              {t.label}
            </Box>
          ))}
        </Box>
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>Actualisation automatique</Typography>
        <Setting label="Activer l'actualisation" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
        {autoRefresh && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: 'text.disabled', mb: 1 }}>Intervalle (secondes)</Typography>
            <Select fullWidth size="small" value={interval_} onChange={(e) => setInterval_(e.target.value)}
              sx={{ borderRadius: 2, background: theme.palette.action.hover, color: theme.palette.text.primary, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '& .MuiSvgIcon-root': { color: theme.palette.text.disabled } }}>
              {['5', '10', '30', '60'].map((v) => <MenuItem key={v} value={v}>{v} secondes</MenuItem>)}
            </Select>
          </Box>
        )}
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>Mode de suivi</Typography>
        <Setting label="Verrouiller la caméra" checked={lockCamera} onChange={() => setLockCamera(!lockCamera)} sub="Le zoom et l'inclinaison sont fixés pendant le suivi." />
        <Divider sx={{ my: 2, borderColor: 'divider' }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: 'text.secondary', mb: 1 }}>Mouvement</Typography>
        <Setting label="Transitions fluides" checked={smoothMovement} onChange={() => setSmoothMovement(!smoothMovement)} sub="Les véhicules se déplacent en douceur entre les positions." />
      </Box>
    </Box>
  );
};

// ─── Panel: Commands ─────────────────────────────────────────────────────────

const CommandsPanel = ({ vehicle, classes, onClose }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const COMMANDS = [
    { key: 'engineResume', label: 'Démarrer', icon: <PlayArrow sx={{ fontSize: 24 }} />, bg: 'rgba(22,163,74,0.2)', color: '#4ade80' },
    { key: 'engineStop', label: 'Arrêter', icon: <Stop sx={{ fontSize: 24 }} />, bg: 'rgba(220,38,38,0.2)', color: '#f87171' },
    { key: 'deviceReboot', label: 'Réinitialiser', icon: <RestartAlt sx={{ fontSize: 24 }} />, bg: 'rgba(124,58,237,0.2)', color: '#a78bfa' },
    { key: 'doorUnlock', label: 'Déverrouiller', icon: <LockOpen sx={{ fontSize: 24 }} />, bg: 'rgba(234,88,12,0.2)', color: '#fb923c' },
    { key: 'outputControl', label: 'Klaxon', icon: <VolumeUp sx={{ fontSize: 24 }} />, bg: 'rgba(37,99,235,0.2)', color: '#60a5fa' },
    { key: 'getLocation', label: 'Localisation SMS', icon: <Sms sx={{ fontSize: 24 }} />, bg: 'rgba(100,116,139,0.2)', color: '#94a3b8' },
  ];

  const sendCommand = async () => {
    if (!selected || !vehicle?.id) return;
    setSending(true);
    try {
      const res = await fetch('/api/commands/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: vehicle.id, type: selected }),
      });
      if (res.ok) {
        setSnack({ open: true, msg: 'Commande envoyée avec succès', severity: 'success' });
        setSelected(null);
      } else {
        const err = await res.json();
        setSnack({ open: true, msg: err.message || "Erreur lors de l'envoi", severity: 'error' });
      }
    } catch { setSnack({ open: true, msg: 'Erreur réseau', severity: 'error' }); }
    finally { setSending(false); }
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Commandes</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary' }}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Box className={classes.commandGrid}>
          {COMMANDS.map((cmd) => (
            <Box key={cmd.key} className={classes.commandBtn} onClick={() => setSelected(cmd.key)}
              sx={selected === cmd.key ? { borderColor: '#6366f1 !important', bgcolor: 'rgba(99,102,241,0.15) !important' } : {}}>
              <Box className={classes.commandIcon} sx={{ bgcolor: cmd.bg }}>
                <Box sx={{ color: cmd.color, display: 'flex' }}>{cmd.icon}</Box>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: 'text.primary', textAlign: 'center' }}>{cmd.label}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Button fullWidth variant="contained" disableElevation disabled={!selected || sending} onClick={sendCommand}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}>
          {sending ? 'Envoi…' : 'Envoyer la commande'}
        </Button>
      </Box>
      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>{snack.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Right toolbar config ─────────────────────────────────────────────────────

const RIGHT_TOOLBAR = [
  { key: 'refresh', Icon: Refresh, title: 'Actualiser' },
  null,
  { key: 'share', Icon: Share, title: 'Partager' },
  { key: 'geofence', Icon: FmdGoodOutlined, title: 'Géofence' },
  { key: 'settings', Icon: MapOutlined, title: 'Carte' },
  { key: 'commands', Icon: SettingsRemoteOutlined, title: 'Commandes' },
  { key: 'alerts', Icon: NotificationsOutlined, title: 'Alertes' },
  null,
  { key: 'zoomIn', Icon: ZoomIn, title: 'Zoom +' },
  { key: 'zoomOut', Icon: ZoomOut, title: 'Zoom −' },
  { key: 'locate', Icon: MyLocationOutlined, title: 'Ma position' },
  { key: 'history', Icon: HistoryOutlined, title: 'Historique' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const MainPageNew = () => {
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const [searchValue, setSearchValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(false);

  const [, setFilter] = usePersistedState('filter', { statuses: [], groups: [] });
  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const devices = useSelector((state) => state.devices.items);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);
  const speedUnit = useAttributePreference('speedUnit', 'kn');

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const [devRes, posRes] = await Promise.all([fetch('/api/devices'), fetch('/api/positions')]);
      if (devRes.ok) dispatch(devicesActions.refresh(await devRes.json()));
      if (posRes.ok) {
        const posData = await posRes.json();
        if (posData?.length > 0) dispatch(sessionActions.updatePositions(posData));
      }
    } catch (e) { console.error('Fetch error:', e); }
    finally { setLoadingData(false); }
  }, [dispatch]);

  useEffectAsync(async () => {
    await fetchData();
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, []);

  const derivedFilter = useMemo(() => {
    if (activeFilter === 'moving') return { statuses: ['online'], groups: [] };
    if (activeFilter === 'parked') return { statuses: ['offline'], groups: [] };
    return { statuses: [], groups: [] };
  }, [activeFilter]);

  useFilter(searchValue, derivedFilter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  const vehicles = useMemo(() => filteredDevices.map((device) => {
    const position = positions[device.id];
    const speed = position?.speed != null ? Math.round(speedFromKnots(position.speed, speedUnit)) : 0;
    const isMoving = speed > 0;
    const status = device.status === 'online' ? (isMoving ? 'Mouvement' : 'Garé') : 'Offline';
    const statusColor = device.status === 'online' ? (isMoving ? '#10b981' : '#3b82f6') : '#94a3b8';
    const timeAgo = device.lastUpdate ? dayjs(device.lastUpdate).fromNow(true) : '—';
    const odometer = (position?.attributes?.odometer || position?.attributes?.totalDistance || 0) / 1000;
    const fuel = position?.attributes?.fuel || position?.attributes?.volume || 0;
    const fuelCapacity = device.attributes?.fuelCapacity || 100;
    const fuelPercentage = fuelCapacity > 0 ? Math.min(100, Math.round((fuel / fuelCapacity) * 100)) : 0;
    const distance = (position?.attributes?.totalDistance || 0) / 1000;
    const consumption = position?.attributes?.fuelConsumption || 0;
    return {
      id: device.id.toString(), name: device.name || device.uniqueId || `Appareil ${device.id}`,
      status, statusColor, timeAgo, speed, odometer, consumption,
      distance: parseFloat(distance.toFixed(1)), fuel: parseFloat(fuel.toFixed(1)),
      fuelPercentage, type: device.category || 'Vehicle', device, position,
    };
  }), [filteredDevices, positions, speedUnit]);

  const displayedVehicles = useMemo(() => {
    let v = vehicles;
    if (activeFilter === 'moving') v = v.filter((x) => x.speed > 0);
    if (activeFilter === 'parked') v = v.filter((x) => x.speed === 0 && x.device.status === 'online');
    if (activeFilter === 'stopped') v = v.filter((x) => x.device.status === 'offline');
    if (activeFilter === 'alert') v = v.filter((x) => x.position?.attributes?.alarm);
    return v;
  }, [vehicles, activeFilter]);

  const totalCount = Object.keys(devices).length;
  const selectedVehicle = useMemo(() => vehicles.find((v) => v.id === selectedDeviceId?.toString()) || null, [vehicles, selectedDeviceId]);
  const togglePanel = (key) => setActivePanel((p) => (p === key ? null : key));
  const handleToolbarClick = (key) => {
    if (key === 'refresh') { fetchData(); return; }
    if (['share', 'alerts', 'geofence', 'settings', 'commands'].includes(key)) togglePanel(key);
  };
  const selectedPosition = filteredPositions.find((p) => selectedDeviceId && p.deviceId === selectedDeviceId);
  const onEventsClick = useCallback(() => { }, []);

  return (
    <PageLayout>
      <Box className={classes.mainContainer}>

        <Box className={classes.mapContainer}>
          <MainMap filteredPositions={filteredPositions} selectedPosition={selectedPosition} onEventsClick={onEventsClick} />
          {selectedVehicle && (
            <StatusCardNew
              vehicle={selectedVehicle}
              batteryVoltage={selectedVehicle.position?.attributes?.battery || selectedVehicle.position?.attributes?.power || '12.0'}
              currentTime={selectedVehicle.position?.fixTime || new Date().toISOString()}
              signalStrength={selectedVehicle.position?.attributes?.rssi || 3}
              temperature={selectedVehicle.position?.attributes?.coolantTemp || 0}
              onClose={() => dispatch(devicesActions.selectId(null))}
              onOdometerClick={() => { }}
              onIconClick={(iconType) => {
                if (iconType === 'share') togglePanel('share');
                else if (iconType === 'alerts') togglePanel('alerts');
                else if (iconType === 'commands') togglePanel('commands');
              }}
            />
          )}
        </Box>

        {!sidebarCollapsed && (
          <Box className={classes.sidebar}>
            <MainToolbar
              fleetName="Flotte"
              deviceCount={totalCount}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilter={activeFilter}
              onFilterClick={setActiveFilter}
              onToggleCollapse={() => setSidebarCollapsed(true)}
            />
            <Box className={classes.vehicleList}>
              {loadingData && displayedVehicles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                  <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                </Box>
              ) : displayedVehicles.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 6 }}>
                  <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>Aucun véhicule trouvé</Typography>
                </Box>
              ) : (
                displayedVehicles.map((vehicle) => (
                  <DeviceRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedDeviceId?.toString() === vehicle.id}
                    onSelect={() => dispatch(devicesActions.selectId(parseInt(vehicle.id, 10)))}
                    onCenter={(v) => dispatch(devicesActions.selectId(parseInt(v.id, 10)))}
                    onHistory={(v) => { window.location.href = `/replay-new?deviceId=${v.id}`; }}
                    onFollow={(v) => dispatch(devicesActions.selectId(parseInt(v.id, 10)))}
                  />
                ))
              )}
            </Box>
          </Box>
        )}

        {sidebarCollapsed && (
          <Fab className={classes.expandFab} onClick={() => setSidebarCollapsed(false)} disableRipple>
            <ChevronRight fontSize="small" />
          </Fab>
        )}

        {!activePanel && (
          <Box className={classes.rightToolbar}>
            {RIGHT_TOOLBAR.map((item, i) => {
              if (item === null) return <Box key={`div-${i}`} className={classes.toolbarDivider} />;
              const { key, Icon, title } = item;
              const isActive = activePanel === key;
              return (
                <Tooltip key={key} title={title} placement="left">
                  <IconButton size="small" className={`${classes.toolbarBtn} ${isActive ? classes.toolbarBtnActive : ''}`} onClick={() => handleToolbarClick(key)}>
                    <Icon fontSize="small" />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Box>
        )}

        {activePanel === 'share' && <SharePanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />}
        {activePanel === 'alerts' && <AlertsPanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />}
        {activePanel === 'geofence' && <GeofencePanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} onSaved={() => { }} />}
        {activePanel === 'settings' && <MapSettingsPanel classes={classes} onClose={() => setActivePanel(null)} />}
        {activePanel === 'commands' && <CommandsPanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />}

      </Box>
    </PageLayout>
  );
};

export default MainPageNew;
