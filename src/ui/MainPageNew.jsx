import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  Box, Paper, Typography, IconButton, Button, Fab, Switch,
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const useStyles = makeStyles()((theme) => ({
  mainContainer: {
    flex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    backgroundColor: '#f1f5f9',
  },

  // Full-screen map behind everything
  mapContainer: {
    position: 'absolute',
    inset: 6,
    borderRadius: 8,
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
  },

  // Left sidebar
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
    backgroundColor: '#ffffff',
    zIndex: 1000,
    boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
  },
  vehicleList: {
    flex: 1,
    overflowY: 'auto',
    padding: theme.spacing(1.5),
    scrollbarWidth: 'thin',
    scrollbarColor: '#e2e8f0 transparent',
    '&::-webkit-scrollbar': { width: 4 },
    '&::-webkit-scrollbar-track': { background: 'transparent' },
    '&::-webkit-scrollbar-thumb': { background: '#e2e8f0', borderRadius: 4 },
  },
  expandFab: {
    position: 'absolute',
    top: 12,
    left: 12,
    zIndex: 1002,
    width: 36,
    height: 36,
    minHeight: 'unset',
    backgroundColor: '#fff',
    color: '#64748b',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
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
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: '10px 7px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
  },
  toolbarDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    margin: '4px 0',
  },
  toolbarBtn: {
    width: 38,
    height: 38,
    borderRadius: '10px !important',
    color: '#64748b',
  },
  toolbarBtnActive: {
    backgroundColor: '#6366f1 !important',
    color: '#fff !important',
  },
  panel: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 360,
    height: 'calc(100% - 12px)',
    backgroundColor: '#fff',
    borderRadius: 12,
    zIndex: 1003,
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  panelHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 20px 16px',
    borderBottom: '1px solid #f1f5f9',
    flexShrink: 0,
  },
  panelTitle: { fontWeight: 800, fontSize: '1.1rem', color: '#1e293b' },
  panelSubtitle: { fontSize: '0.8rem', color: '#6366f1', fontWeight: 600 },
  panelBody: { flex: 1, overflowY: 'auto', padding: '12px 20px' },
  panelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 14,
    padding: '14px 0',
    borderBottom: '1px solid #f1f5f9',
    cursor: 'pointer',
  },
  panelRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  panelRowTitle: { fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' },
  panelRowSub: { fontSize: '0.75rem', color: '#94a3b8' },
  commandGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
  },
  commandBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    padding: '18px 10px',
    borderRadius: 12,
    border: '1.5px solid #f1f5f9',
    cursor: 'pointer',
  },
  commandIcon: {
    width: 50,
    height: 50,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapTypeGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 10,
    marginBottom: 20,
  },
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
  },
}));

// ─── Panel: Share ─────────────────────────────────────────────────────────────

const SharePanel = ({ vehicle, classes, onClose }) => {
  const lat = vehicle?.position?.latitude;
  const lng = vehicle?.position?.longitude;

  const openGoogleMaps = () => {
    if (lat && lng) window.open(`https://maps.google.com/?q=${lat},${lng}`, '_blank');
  };
  const openWaze = () => {
    if (lat && lng) window.open(`https://waze.com/ul?ll=${lat},${lng}&navigate=yes`, '_blank');
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Partager les Données</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {[
          { icon: <MapOutlined />, bg: '#eff6ff', color: '#3b82f6', title: 'Données de Base', sub: 'Plaque, localisation et statut' },
          { icon: <DirectionsCar />, bg: '#f5f3ff', color: '#6366f1', title: 'Données Complètes', sub: 'Toutes les informations du véhicule' },
        ].map((item, i) => (
          <Box key={i} className={classes.panelRow}>
            <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
              <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography className={classes.panelRowTitle}>{item.title}</Typography>
              <Typography className={classes.panelRowSub}>{item.sub}</Typography>
            </Box>
            <ChevronRight sx={{ color: '#cbd5e1', fontSize: 18 }} />
          </Box>
        ))}

        <Typography sx={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600, mt: 2, mb: 1 }}>
          Partager la Localisation
        </Typography>

        <Box className={classes.panelRow} onClick={openGoogleMaps}>
          <Box className={classes.panelRowIcon} sx={{ bgcolor: '#fef3c7' }}>
            <MyLocation sx={{ color: '#f59e0b' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>Google Maps</Typography>
            <Typography className={classes.panelRowSub}>
              {lat ? `${lat.toFixed(5)}, ${lng?.toFixed(5)}` : 'Position non disponible'}
            </Typography>
          </Box>
          <ChevronRight sx={{ color: '#cbd5e1', fontSize: 18 }} />
        </Box>

        <Box className={classes.panelRow} onClick={openWaze}>
          <Box className={classes.panelRowIcon} sx={{ bgcolor: '#ecfdf5' }}>
            <FmdGoodOutlined sx={{ color: '#10b981' }} />
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography className={classes.panelRowTitle}>Waze</Typography>
            <Typography className={classes.panelRowSub}>Naviguer avec Waze</Typography>
          </Box>
          <ChevronRight sx={{ color: '#cbd5e1', fontSize: 18 }} />
        </Box>
      </Box>
    </Box>
  );
};

// ─── Panel: Alerts ────────────────────────────────────────────────────────────

const AlertsPanel = ({ vehicle, classes, onClose }) => {
  const [enabled, setEnabled] = useState({});
  const [saving, setSaving] = useState(false);

  // Fetch existing notifications linked to this device
  useEffect(() => {
    if (!vehicle?.id) return;
    fetch(`/api/notifications?deviceId=${vehicle.id}`)
      .then((r) => r.ok ? r.json() : [])
      .then((notifs) => {
        const map = {};
        notifs.forEach((n, i) => { map[n.type] = true; });
        setEnabled(map);
      })
      .catch(() => { });
  }, [vehicle?.id]);

  const alerts = [
    { key: 'overspeed', icon: <SpeedIcon />, bg: '#eff6ff', color: '#3b82f6', label: 'Alerte de Vitesse' },
    { key: 'ignitionOn', icon: <DirectionsCar />, bg: '#f0fdf4', color: '#22c55e', label: 'Alerte de Démarrage' },
    { key: 'lowBattery', icon: <BatteryAlertOutlined />, bg: '#fffbeb', color: '#f59e0b', label: 'Alerte Batterie Faible' },
    { key: 'deviceOffline', icon: <PowerOffOutlined />, bg: '#faf5ff', color: '#a855f7', label: 'Alerte Hors Ligne' },
    { key: 'alarm', icon: <LocalShipping />, bg: '#fff7ed', color: '#f97316', label: 'Alarme Générale' },
    { key: 'sos', icon: <SportsMotorsports />, bg: '#fdf2f8', color: '#ec4899', label: 'Alerte SOS' },
    { key: 'hardBraking', icon: <Stop />, bg: '#fef2f2', color: '#ef4444', label: 'Alerte de Choc' },
    { key: 'geofenceEnter', icon: <FmdGoodOutlined />, bg: '#ecfdf5', color: '#10b981', label: 'Entrée Géofence' },
  ];

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Alertes</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        {alerts.map((item) => (
          <Box key={item.key} className={classes.panelRow} sx={{ cursor: 'default' }}>
            <Box className={classes.panelRowIcon} sx={{ bgcolor: item.bg }}>
              <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
            </Box>
            <Typography className={classes.panelRowTitle} sx={{ flex: 1 }}>{item.label}</Typography>
            <Switch
              size="small"
              checked={!!enabled[item.key]}
              onChange={() => setEnabled((p) => ({ ...p, [item.key]: !p[item.key] }))}
              sx={{ '& .MuiSwitch-thumb': { boxShadow: 'none' }, '& .Mui-checked': { color: '#6366f1' } }}
            />
          </Box>
        ))}
      </Box>
    </Box>
  );
};

// ─── Panel: Geofence ─────────────────────────────────────────────────────────

const GeofencePanel = ({ vehicle, classes, onClose, onSaved }) => {
  const [radius, setRadius] = useState(0.5);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const lat = vehicle?.position?.latitude ?? 32.2356;
  const lng = vehicle?.position?.longitude ?? -7.9563;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      // Build WKT circle using turf-like polygon approximation
      const steps = 64;
      const R = 6371000;
      const coords = [];
      for (let i = 0; i <= steps; i++) {
        const angle = (i / steps) * 2 * Math.PI;
        const dLat = (radius * 1000 * Math.cos(angle)) / R;
        const dLng = (radius * 1000 * Math.sin(angle)) / (R * Math.cos((lat * Math.PI) / 180));
        coords.push(`${(lng + (dLng * 180) / Math.PI).toFixed(6)} ${(lat + (dLat * 180) / Math.PI).toFixed(6)}`);
      }
      const wkt = `CIRCLE (${lng.toFixed(6)} ${lat.toFixed(6)}, ${Math.round(radius * 1000)})`;

      const res = await fetch('/api/geofences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, area: wkt, calendarId: 0 }),
      });
      if (res.ok) {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Géofences</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Box sx={{ bgcolor: '#f0f9ff', borderRadius: 2, p: 1.5, mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', mb: 0.5 }}>
            Créer une géofence circulaire
          </Typography>
          <Typography sx={{ fontSize: '0.77rem', color: '#0ea5e9', lineHeight: 1.6 }}>
            La géofence sera centrée sur la position actuelle du véhicule.
          </Typography>
        </Box>

        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', mb: 0.5 }}>
          Nom <span style={{ color: '#ef4444' }}>*</span>
        </Typography>
        <TextField
          fullWidth size="small" placeholder="ex: Maison, Bureau, Zone de livraison"
          value={name} onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2.5, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569' }}>Rayon</Typography>
          <Box sx={{ bgcolor: '#6366f1', color: '#fff', borderRadius: 1, px: 1.5, py: 0.25, fontSize: '0.77rem', fontWeight: 700 }}>
            {Math.round(radius * 1000)} m
          </Box>
        </Box>
        <Slider
          value={radius} min={0.1} max={5} step={0.1}
          onChange={(_, v) => setRadius(v)}
          sx={{ color: '#6366f1', mb: 2.5 }}
        />

        <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', mb: 1 }}>
          📍 Position actuelle
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, fontSize: '0.82rem' }}>
          <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>Lat:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{lat.toFixed(5)}</Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.4, mb: 2.5 }}>
          <Typography sx={{ fontSize: '0.82rem', color: '#64748b' }}>Lng:</Typography>
          <Typography sx={{ fontSize: '0.82rem', fontWeight: 600 }}>{lng.toFixed(5)}</Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth variant="contained" disableElevation
            disabled={!name.trim() || saving}
            onClick={handleSave}
            sx={{ bgcolor: '#6366f1', borderRadius: 2, textTransform: 'none', fontWeight: 600, '&:hover': { bgcolor: '#4f46e5' } }}
          >
            {saving ? '...' : '✓ Enregistrer'}
          </Button>
          <Button
            fullWidth variant="outlined" onClick={onClose}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b' }}
          >
            Annuler
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

// ─── Panel: Map Settings ──────────────────────────────────────────────────────

const MapSettingsPanel = ({ classes, onClose }) => {
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
        <Typography sx={{ fontSize: '0.86rem', fontWeight: 600, color: '#1e293b' }}>{label}</Typography>
        <Switch size="small" checked={checked} onChange={onChange} />
      </Box>
      {sub && <Typography sx={{ fontSize: '0.73rem', color: '#94a3b8', pb: 0.5 }}>{sub}</Typography>}
    </Box>
  );

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Typography className={classes.panelTitle}>Paramètres de la carte</Typography>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', mb: 1.5 }}>Type de carte</Typography>
        <Box className={classes.mapTypeGrid}>
          {MAP_TYPES.map((t) => (
            <Box key={t.key} className={`${classes.mapTypeBtn} ${mapType === t.key ? 'selected' : ''}`}
              onClick={() => setMapType(t.key)}>
              <span style={{ fontSize: 22 }}>{t.emoji}</span>
              {t.label}
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', mb: 1 }}>Actualisation automatique</Typography>
        <Setting label="Activer l'actualisation" checked={autoRefresh} onChange={() => setAutoRefresh(!autoRefresh)} />
        {autoRefresh && (
          <Box sx={{ mb: 2 }}>
            <Typography sx={{ fontSize: '0.8rem', color: '#64748b', mb: 1 }}>Intervalle (secondes)</Typography>
            <Select fullWidth size="small" value={interval_} onChange={(e) => setInterval_(e.target.value)} sx={{ borderRadius: 2 }}>
              {['5', '10', '30', '60'].map((v) => (
                <MenuItem key={v} value={v}>{v} secondes</MenuItem>
              ))}
            </Select>
          </Box>
        )}

        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', mb: 1 }}>Mode de suivi</Typography>
        <Setting label="Verrouiller la caméra" checked={lockCamera} onChange={() => setLockCamera(!lockCamera)}
          sub="Le zoom et l'inclinaison sont fixés pendant le suivi." />

        <Divider sx={{ my: 2 }} />
        <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', mb: 1 }}>Mouvement</Typography>
        <Setting label="Transitions fluides" checked={smoothMovement} onChange={() => setSmoothMovement(!smoothMovement)}
          sub="Les véhicules se déplacent en douceur entre les positions." />
      </Box>
    </Box>
  );
};

// ─── Panel: Commands ─────────────────────────────────────────────────────────

const CommandsPanel = ({ vehicle, classes, onClose }) => {
  const [selected, setSelected] = useState(null);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const COMMANDS = [
    { key: 'engineResume', label: 'Démarrer', icon: <PlayArrow sx={{ fontSize: 24 }} />, bg: '#dcfce7', color: '#16a34a' },
    { key: 'engineStop', label: 'Arrêter', icon: <Stop sx={{ fontSize: 24 }} />, bg: '#fee2e2', color: '#dc2626' },
    { key: 'deviceReboot', label: 'Réinitialiser', icon: <RestartAlt sx={{ fontSize: 24 }} />, bg: '#f5f3ff', color: '#7c3aed' },
    { key: 'doorUnlock', label: 'Déverrouiller', icon: <LockOpen sx={{ fontSize: 24 }} />, bg: '#fff7ed', color: '#ea580c' },
    { key: 'outputControl', label: 'Klaxon', icon: <VolumeUp sx={{ fontSize: 24 }} />, bg: '#eff6ff', color: '#2563eb' },
    { key: 'getLocation', label: 'Localisation SMS', icon: <Sms sx={{ fontSize: 24 }} />, bg: '#f8fafc', color: '#475569' },
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
        setSnack({ open: true, msg: err.message || 'Erreur lors de l\'envoi', severity: 'error' });
      }
    } catch {
      setSnack({ open: true, msg: 'Erreur réseau', severity: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Box className={classes.panel}>
      <Box className={classes.panelHeader}>
        <Box>
          <Typography className={classes.panelTitle}>Commandes</Typography>
          <Typography className={classes.panelSubtitle}>{vehicle?.name || '—'}</Typography>
        </Box>
        <IconButton size="small" onClick={onClose}><Close fontSize="small" /></IconButton>
      </Box>
      <Box className={classes.panelBody}>
        <Box className={classes.commandGrid}>
          {COMMANDS.map((cmd) => (
            <Box
              key={cmd.key}
              className={classes.commandBtn}
              onClick={() => setSelected(cmd.key)}
              style={{
                borderColor: selected === cmd.key ? '#6366f1' : '#f1f5f9',
                backgroundColor: selected === cmd.key ? '#f5f3ff' : '#fff',
              }}
            >
              <Box className={classes.commandIcon} sx={{ bgcolor: cmd.bg }}>
                <Box sx={{ color: cmd.color, display: 'flex' }}>{cmd.icon}</Box>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b', textAlign: 'center' }}>
                {cmd.label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ p: 2, borderTop: '1px solid #f1f5f9' }}>
        <Button
          fullWidth variant="contained" disableElevation
          disabled={!selected || sending}
          onClick={sendCommand}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' } }}
        >
          {sending ? 'Envoi…' : 'Envoyer la commande'}
        </Button>
      </Box>
      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// ─── Right toolbar button config ──────────────────────────────────────────────

// Mirror of what the screenshot shows on the right edge
const RIGHT_TOOLBAR = [
  { key: 'refresh', Icon: Refresh, title: 'Actualiser', group: 'top' },
  null,  // divider
  { key: 'share', Icon: Share, title: 'Partager', group: 'panels' },
  { key: 'geofence', Icon: FmdGoodOutlined, title: 'Géofence', group: 'panels' },
  { key: 'settings', Icon: MapOutlined, title: 'Carte', group: 'panels' },
  { key: 'commands', Icon: SettingsRemoteOutlined, title: 'Commandes', group: 'panels' },
  { key: 'alerts', Icon: NotificationsOutlined, title: 'Alertes', group: 'panels' },
  null,  // divider
  { key: 'zoomIn', Icon: ZoomIn, title: 'Zoom +', group: 'map' },
  { key: 'zoomOut', Icon: ZoomOut, title: 'Zoom −', group: 'map' },
  { key: 'locate', Icon: MyLocationOutlined, title: 'Ma position', group: 'map' },
  { key: 'history', Icon: HistoryOutlined, title: 'Historique', group: 'map' },
];

// ─── Main Component ───────────────────────────────────────────────────────────

const MainPageNew = () => {
  const theme = useTheme();
  const { classes } = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const [searchValue, setSearchValue] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [loadingData, setLoadingData] = useState(false);

  const [filter, setFilter] = usePersistedState('filter', { statuses: [], groups: [] });
  const [filterSort] = usePersistedState('filterSort', '');
  const [filterMap] = usePersistedState('filterMap', false);

  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const devices = useSelector((state) => state.devices.items);
  const [filteredPositions, setFilteredPositions] = useState([]);
  const [filteredDevices, setFilteredDevices] = useState([]);

  const speedUnit = useAttributePreference('speedUnit', 'kn');

  // ── Auto-fetch + polling ───────────────────────────────────────────────────
  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoadingData(true);
    try {
      const [devRes, posRes] = await Promise.all([
        fetch('/api/devices'),
        fetch('/api/positions'),
      ]);
      if (devRes.ok) dispatch(devicesActions.refresh(await devRes.json()));
      if (posRes.ok) {
        const posData = await posRes.json();
        if (posData?.length > 0) dispatch(sessionActions.updatePositions(posData));
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoadingData(false);
    }
  }, [dispatch]);

  useEffectAsync(async () => {
    await fetchData();
    const id = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(id);
  }, []);

  // ── Filtering by filter tab ────────────────────────────────────────────────
  const derivedFilter = useMemo(() => {
    if (activeFilter === 'all') return { statuses: [], groups: [] };
    if (activeFilter === 'moving') return { statuses: ['online'], groups: [] };
    if (activeFilter === 'parked') return { statuses: ['offline'], groups: [] };
    return { statuses: [], groups: [] };
  }, [activeFilter]);

  useFilter(searchValue, derivedFilter, filterSort, filterMap, positions, setFilteredDevices, setFilteredPositions);

  // ── Vehicle data transformation ────────────────────────────────────────────
  const vehicles = useMemo(() => {
    return filteredDevices.map((device) => {
      const position = positions[device.id];
      const speed = position?.speed != null ? Math.round(speedFromKnots(position.speed, speedUnit)) : 0;
      const isMoving = speed > 0;
      const status = device.status === 'online' ? (isMoving ? 'Mouvement' : 'Garé') : 'Offline';
      const statusColor = device.status === 'online'
        ? (isMoving ? '#10b981' : '#3b82f6')
        : '#94a3b8';
      const timeAgo = device.lastUpdate ? dayjs(device.lastUpdate).fromNow(true) : '—';
      const odometer = (position?.attributes?.odometer || position?.attributes?.totalDistance || 0) / 1000;
      const fuel = position?.attributes?.fuel || position?.attributes?.volume || 0;
      const fuelCapacity = device.attributes?.fuelCapacity || 100;
      const fuelPercentage = fuelCapacity > 0 ? Math.min(100, Math.round((fuel / fuelCapacity) * 100)) : 0;
      const distance = (position?.attributes?.totalDistance || 0) / 1000;
      const consumption = position?.attributes?.fuelConsumption || 0;

      return {
        id: device.id.toString(),
        name: device.name || device.uniqueId || `Appareil ${device.id}`,
        status, statusColor, timeAgo,
        speed, odometer, consumption,
        distance: parseFloat(distance.toFixed(1)),
        fuel: parseFloat(fuel.toFixed(1)),
        fuelPercentage,
        type: device.category || 'Vehicle',
        device, position,
      };
    });
  }, [filteredDevices, positions, speedUnit]);

  // Filter vehicles by tab
  const displayedVehicles = useMemo(() => {
    let v = vehicles;
    if (activeFilter === 'moving') v = v.filter((x) => x.speed > 0);
    if (activeFilter === 'parked') v = v.filter((x) => x.speed === 0 && x.device.status === 'online');
    if (activeFilter === 'stopped') v = v.filter((x) => x.device.status === 'offline');
    if (activeFilter === 'alert') v = v.filter((x) => x.position?.attributes?.alarm);
    return v;
  }, [vehicles, activeFilter]);

  const totalCount = Object.keys(devices).length;

  // Selected vehicle full data
  const selectedVehicle = useMemo(
    () => vehicles.find((v) => v.id === selectedDeviceId?.toString()) || null,
    [vehicles, selectedDeviceId],
  );

  const onEventsClick = useCallback(() => { }, []);
  const togglePanel = (key) => setActivePanel((p) => (p === key ? null : key));

  const handleToolbarClick = (key) => {
    if (key === 'refresh') {
      fetchData();
      return;
    }
    if (['share', 'alerts', 'geofence', 'settings', 'commands'].includes(key)) {
      togglePanel(key);
      return;
    }
  };

  const handleFilterClick = (filterId) => {
    setActiveFilter(filterId);
  };

  const selectedPosition = filteredPositions.find(
    (p) => selectedDeviceId && p.deviceId === selectedDeviceId,
  );

  return (
    <PageLayout>
      <Box className={classes.mainContainer}>

        {/* ── Full-screen map ─────────────────────────────────────────────── */}
        <Box className={classes.mapContainer}>
          <MainMap
            filteredPositions={filteredPositions}
            selectedPosition={selectedPosition}
            onEventsClick={onEventsClick}
          />

          {/* Status card — bottom center */}
          {selectedVehicle && (
            <StatusCardNew
              vehicle={selectedVehicle}
              batteryVoltage={
                selectedVehicle.position?.attributes?.battery ||
                selectedVehicle.position?.attributes?.power ||
                '12.0'
              }
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

        {/* ── Left sidebar ────────────────────────────────────────────────── */}
        {!sidebarCollapsed && (
          <Paper elevation={0} className={classes.sidebar}>
            <MainToolbar
              fleetName="Flotte"
              deviceCount={totalCount}
              searchValue={searchValue}
              onSearchChange={setSearchValue}
              activeFilter={activeFilter}
              onFilterClick={handleFilterClick}
              onToggleCollapse={() => setSidebarCollapsed(true)}
            />
            <Box className={classes.vehicleList}>
              {loadingData && displayedVehicles.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', pt: 6 }}>
                  <CircularProgress size={32} sx={{ color: '#6366f1' }} />
                </Box>
              ) : displayedVehicles.length === 0 ? (
                <Box sx={{ textAlign: 'center', pt: 6 }}>
                  <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>
                    Aucun véhicule trouvé
                  </Typography>
                </Box>
              ) : (
                displayedVehicles.map((vehicle) => (
                  <DeviceRow
                    key={vehicle.id}
                    vehicle={vehicle}
                    isSelected={selectedDeviceId?.toString() === vehicle.id}
                    onSelect={() => dispatch(devicesActions.selectId(parseInt(vehicle.id, 10)))}
                    onCenter={(v) => dispatch(devicesActions.selectId(parseInt(v.id, 10)))}
                    onHistory={(v) => window.location.href = `/replay?deviceId=${v.id}`}
                    onFollow={(v) => dispatch(devicesActions.selectId(parseInt(v.id, 10)))}
                  />
                ))
              )}
            </Box>
          </Paper>
        )}

        {/* Collapsed sidebar button */}
        {sidebarCollapsed && (
          <Fab className={classes.expandFab} onClick={() => setSidebarCollapsed(false)} disableRipple>
            <ChevronRight fontSize="small" />
          </Fab>
        )}

        {/* ── Right toolbar — hidden when panel is open ──────────────────── */}
        {!activePanel && <Box className={classes.rightToolbar}>
          {RIGHT_TOOLBAR.map((item, i) => {
            if (item === null) return <Box key={`div-${i}`} className={classes.toolbarDivider} />;
            const { key, Icon, title } = item;
            const isActive = activePanel === key;
            return (
              <Tooltip key={key} title={title} placement="left">
                <IconButton
                  size="small"
                  className={`${classes.toolbarBtn} ${isActive ? classes.toolbarBtnActive : ''}`}
                  onClick={() => handleToolbarClick(key)}
                >
                  <Icon fontSize="small" />
                </IconButton>
              </Tooltip>
            );
          })}
        </Box>}

        {/* ── Active panel ────────────────────────────────────────────────── */}
        {activePanel === 'share' && (
          <SharePanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'alerts' && (
          <AlertsPanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'geofence' && (
          <GeofencePanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} onSaved={() => { }} />
        )}
        {activePanel === 'settings' && (
          <MapSettingsPanel classes={classes} onClose={() => setActivePanel(null)} />
        )}
        {activePanel === 'commands' && (
          <CommandsPanel vehicle={selectedVehicle} classes={classes} onClose={() => setActivePanel(null)} />
        )}

      </Box>
    </PageLayout>
  );
};

export default MainPageNew;
