import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Box, Typography, Paper, TextField, Button, IconButton,
  LinearProgress, Chip, InputAdornment, Stack, Skeleton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem, Snackbar, Alert,
  Tooltip,
} from '@mui/material';
import {
  Search, Edit, Delete, Add, Layers, MedicalServicesOutlined,
  Construction, Waves, BuildOutlined, Refresh, Close,
  WarningAmberOutlined, CheckCircleOutlineOutlined, TimerOutlined,
} from '@mui/icons-material';
import { makeStyles } from 'tss-react/mui';
import dayjs from 'dayjs';
import PageLayout from './PageLayout';

// ─── Styles ──────────────────────────────────────────────────────────────────

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
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing(3),
  },
  pageTitle: {
    fontWeight: 800,
    color: '#1e293b',
    fontSize: '1.25rem',
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  pageSubtitle: { color: '#64748b', fontSize: '0.85rem' },
  searchAndFilterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(3),
    flexWrap: 'wrap',
    gap: theme.spacing(2),
  },
  searchField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: '#fff',
      borderRadius: '25px',
      width: '350px',
      height: '45px',
      fontSize: '0.9rem',
      '& fieldset': { borderColor: '#e2e8f0' },
    },
  },
  filterIcon: {
    width: 40,
    height: 40,
    border: '1px solid #e2e8f0',
    backgroundColor: '#fff',
    color: '#64748b',
  },
  filterIconActive: {
    backgroundColor: '#64748b',
    color: '#fff',
    '&:hover': { backgroundColor: '#475569' },
  },
  createButton: {
    borderRadius: '25px',
    textTransform: 'none',
    fontWeight: 600,
    padding: '8px 24px',
    backgroundColor: '#6366f1',
    color: '#fff',
    '&:hover': { backgroundColor: '#4f46e5' },
  },
  maintenanceCard: {
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid #f1f5f9',
    transition: 'transform 0.2s, box-shadow 0.2s',
    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' },
  },
  bgRed: { background: 'linear-gradient(180deg, #fff1f0 0%, #ffffff 100%)' },
  bgOrange: { background: 'linear-gradient(180deg, #fffbe6 0%, #ffffff 100%)' },
  bgGreen: { background: 'linear-gradient(180deg, #f6ffed 0%, #ffffff 100%)' },
  bgTeal: { background: 'linear-gradient(180deg, #e6fffb 0%, #ffffff 100%)' },
  cardHeader: {
    padding: '16px 16px 8px 16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: '0.95rem',
    fontWeight: 700,
    color: '#1e1b4b',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  priceChip: { fontWeight: 700, borderRadius: '4px', height: '24px' },
  vehicleInfo: {
    fontSize: '0.75rem',
    color: '#64748b',
    padding: '0 16px 16px 40px',
    fontWeight: 500,
  },
  detailsGrid: {
    padding: '0 16px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    rowGap: '4px',
    columnGap: '12px',
    fontSize: '0.8rem',
  },
  label: { color: '#94a3b8' },
  value: { color: '#1e293b', fontWeight: 600 },
  progressSection: { padding: '16px' },
  progressHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px',
    '& span': { fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 },
  },
  progressBar: { height: 6, borderRadius: 3 },
  cardActions: {
    display: 'flex',
    borderTop: '1px solid #f1f5f9',
    '& button': {
      flex: 1,
      textTransform: 'none',
      color: '#64748b',
      fontSize: '0.8rem',
      padding: '8px',
    },
  },
  // Summary badges at top
  summaryBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 16px',
    borderRadius: 12,
    backgroundColor: '#fff',
    border: '1px solid #f1f5f9',
    fontSize: '0.85rem',
    fontWeight: 600,
  },
}));

// ─── Constants ────────────────────────────────────────────────────────────────

// Maintenance type → human-readable label mapping
const TYPE_LABELS = {
  totalDistance: 'Distance totale',
  odometer: 'Odomètre',
  hours: 'Heures moteur',
  drivingTime: 'Temps de conduite',
  deviceTime: 'Date/Heure',
  fixTime: 'Heure GPS',
  serverTime: 'Heure serveur',
};

// Filter keys used in the UI toolbar
const FILTER_ALL = 'all';
const FILTER_EXPIRED = 'expired';   // remaining <= 0
const FILTER_URGENT = 'urgent';    // 0 < progress < 30
const FILTER_UPCOMING = 'upcoming';  // progress >= 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format a Traccar maintenance "start" value into a readable date/value string */
const formatStart = (type, start) => {
  if (!type || start == null) return '—';
  if (type.endsWith('Time')) return dayjs(start).format('DD/MM/YYYY');
  if (type === 'hours' || type === 'drivingTime') return `${(start / 3600000).toFixed(0)} h`;
  // distance types (metres)
  return `${(start / 1000).toFixed(0)} km`;
};

/** Format a Traccar maintenance "period" value */
const formatPeriod = (type, period) => {
  if (!type || period == null) return '—';
  if (type.endsWith('Time')) return `${(period / 86400000).toFixed(0)} jours`;
  if (type === 'hours' || type === 'drivingTime') return `${(period / 3600000).toFixed(0)} h`;
  return `${(period / 1000).toFixed(0)} km`;
};

/**
 * Compute progress % and remaining text from:
 *  - maintenance: { type, start, period }
 *  - currentValue: the device's current value for this type (from last position)
 *
 * For time-based: start is epoch ms, period is duration ms
 *   → end = start + period
 *   → elapsed = now - start
 *   → progress = elapsed / period * 100
 *   → remaining = end - now (in days)
 *
 * For distance/hours:
 *   → end = start + period
 *   → progress = (currentValue - start) / period * 100  (clamped 0–100)
 *   → remaining = end - currentValue
 */
const computeProgress = (type, start, period, currentValue) => {
  if (!type || start == null || period == null || period === 0) {
    return { progress: 0, remaining: '—', endValue: null };
  }

  if (type.endsWith('Time')) {
    const now = Date.now();
    const end = start + period;
    const elapsed = now - start;
    const progress = Math.min(100, Math.max(0, (elapsed / period) * 100));
    const remainingMs = end - now;
    const remainingDays = Math.ceil(remainingMs / 86400000);
    const remaining = remainingDays <= 0
      ? '0 jours'
      : `${remainingDays} jour${remainingDays > 1 ? 's' : ''}`;
    return { progress: Math.round(progress), remaining, endValue: dayjs(end).format('DD/MM/YYYY'), expired: remainingDays <= 0 };
  }

  if (type === 'hours' || type === 'drivingTime') {
    const end = start + period;
    const curr = currentValue || 0;
    const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
    const remainingH = Math.max(0, (end - curr) / 3600000);
    const remaining = remainingH <= 0 ? '0 h' : `${remainingH.toFixed(1)} h`;
    return { progress: Math.round(progress), remaining, endValue: `${(end / 3600000).toFixed(0)} h`, expired: remainingH <= 0 };
  }

  // distance (metres)
  const end = start + period;
  const curr = currentValue || 0;
  const progress = Math.min(100, Math.max(0, ((curr - start) / period) * 100));
  const remainingM = Math.max(0, end - curr);
  const remaining = remainingM <= 0 ? '0 km' : `${(remainingM / 1000).toFixed(0)} km`;
  return { progress: Math.round(progress), remaining, endValue: `${(end / 1000).toFixed(0)} km`, expired: remainingM <= 0 };
};

/** Derive card status colour from progress & expired */
const statusFromProgress = (progress, expired) => {
  if (expired || progress >= 100) return 'red';
  if (progress >= 75) return 'orange';
  if (progress >= 30) return 'green';
  return 'teal';
};

/** Get the correct position attribute value for a maintenance type */
const currentValueForType = (type, position) => {
  if (!position) return 0;
  if (type === 'totalDistance') return position.attributes?.totalDistance || 0;
  if (type === 'odometer') return position.attributes?.odometer || 0;
  if (type === 'hours') return position.attributes?.hours || 0;
  if (type === 'drivingTime') return position.attributes?.drivingTime || 0;
  // time-based — use Date.now() (handled in computeProgress)
  return 0;
};

// ─── Sub-components ────────────────────────────────────────────────────────────

const CardSkeleton = () => (
  <Box sx={{ width: 'calc(25% - 15px)', flexShrink: 0 }}>
    <Paper elevation={0} sx={{ borderRadius: '12px', p: 2, border: '1px solid #f1f5f9' }}>
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="40%" height={18} sx={{ mb: 1 }} />
      <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
      <Skeleton variant="rectangular" height={8} sx={{ borderRadius: 1 }} />
    </Paper>
  </Box>
);

// ─── Create / Edit Dialog ─────────────────────────────────────────────────────

const EDITABLE_TYPES = [
  { key: 'totalDistance', label: 'Distance totale (km)' },
  { key: 'odometer', label: 'Odomètre (km)' },
  { key: 'hours', label: 'Heures moteur' },
  { key: 'fixTime', label: 'Date GPS (date)' },
  { key: 'deviceTime', label: 'Date appareil (date)' },
];

const MaintenanceDialog = ({ open, onClose, onSave, devices, editItem }) => {
  const isEdit = !!editItem;

  const [form, setForm] = useState({
    name: '', type: 'totalDistance', start: '', period: '', deviceId: '',
  });

  useEffect(() => {
    if (editItem) {
      setForm({
        name: editItem.name || '',
        type: editItem.type || 'totalDistance',
        start: editItem._startDisplay || '',
        period: editItem._periodDisplay || '',
        deviceId: editItem._deviceId || '',
      });
    } else {
      setForm({ name: '', type: 'totalDistance', start: '', period: '', deviceId: '' });
    }
  }, [editItem, open]);

  const isTimeType = form.type?.endsWith('Time');

  /** Convert display value → raw Traccar value */
  const toRaw = (key, val) => {
    const v = parseFloat(val) || 0;
    if (key === 'start' && isTimeType) return dayjs(form.start).valueOf();
    if (key === 'period' && isTimeType) return v * 86400000;
    if (form.type === 'hours' || form.type === 'drivingTime') return v * 3600000;
    return v * 1000; // km → metres
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      type: form.type,
      start: toRaw('start', form.start),
      period: toRaw('period', form.period),
    };
    await onSave(payload, form.deviceId, editItem?.id);
    onClose();
  };

  const startLabel = isTimeType ? 'Date de début' : (form.type === 'hours' || form.type === 'drivingTime') ? 'Début (heures)' : 'Début (km)';
  const periodLabel = isTimeType ? 'Durée (jours)' : (form.type === 'hours' || form.type === 'drivingTime') ? 'Période (heures)' : 'Période (km)';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', pb: 1 }}>
        {isEdit ? 'Modifier la maintenance' : 'Créer une maintenance'}
        <IconButton onClick={onClose} size="small" sx={{ position: 'absolute', right: 12, top: 12 }}>
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField
          label="Nom"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth size="small"
        />
        <FormControl fullWidth size="small">
          <InputLabel>Type</InputLabel>
          <Select
            label="Type"
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value, start: '', period: '' })}
          >
            {EDITABLE_TYPES.map((t) => (
              <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label={startLabel}
          type={isTimeType ? 'date' : 'number'}
          value={form.start}
          onChange={(e) => setForm({ ...form, start: e.target.value })}
          fullWidth size="small"
          InputLabelProps={isTimeType ? { shrink: true } : undefined}
        />
        <TextField
          label={periodLabel}
          type="number"
          value={form.period}
          onChange={(e) => setForm({ ...form, period: e.target.value })}
          fullWidth size="small"
        />
        <FormControl fullWidth size="small">
          <InputLabel>Véhicule (optionnel)</InputLabel>
          <Select
            label="Véhicule (optionnel)"
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
          >
            <MenuItem value=""><em>Aucun</em></MenuItem>
            {devices.map((d) => (
              <MenuItem key={d.id} value={d.id}>{d.name || d.uniqueId}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Annuler</Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!form.name || !form.type || !form.start || !form.period}
          sx={{ textTransform: 'none', bgcolor: '#6366f1', '&:hover': { bgcolor: '#4f46e5' }, borderRadius: 2 }}
        >
          {isEdit ? 'Enregistrer' : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Delete Confirm Dialog ────────────────────────────────────────────────────

const DeleteDialog = ({ open, onClose, onConfirm, name }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
    <DialogTitle sx={{ fontWeight: 700 }}>Supprimer la maintenance</DialogTitle>
    <DialogContent>
      <Typography>Voulez-vous vraiment supprimer <strong>{name}</strong> ?</Typography>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b' }}>Annuler</Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        sx={{ textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, borderRadius: 2 }}
      >
        Supprimer
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Main Component ───────────────────────────────────────────────────────────

const MaintenanceDashboard = () => {
  const { classes } = useStyles();

  // ── state ──────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [maintenances, setMaintenances] = useState([]);   // raw from /api/maintenance
  const [devices, setDevices] = useState([]);   // raw from /api/devices
  const [positions, setPositions] = useState({});   // deviceId → position
  // deviceId → [maintenanceId, ...]
  const [deviceMaintenanceMap, setDeviceMaintenanceMap] = useState({});

  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTER_ALL);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. All maintenances
      const mRes = await fetch('/api/maintenance');
      if (!mRes.ok) throw new Error('Impossible de charger les maintenances');
      const mData = await mRes.json();
      setMaintenances(mData);

      // 2. All devices
      const dRes = await fetch('/api/devices');
      if (!dRes.ok) throw new Error('Impossible de charger les véhicules');
      const dData = await dRes.json();
      setDevices(dData);

      // 3. Last known positions (all devices)
      const pRes = await fetch('/api/positions');
      if (pRes.ok) {
        const pData = await pRes.json();
        const pMap = {};
        pData.forEach((p) => { pMap[p.deviceId] = p; });
        setPositions(pMap);
      }

      // 4. For each device, fetch its linked maintenances
      //    GET /api/maintenance?deviceId=X  returns maintenances linked to device X
      const devMainMap = {};
      await Promise.all(
        dData.map(async (device) => {
          try {
            const r = await fetch(`/api/maintenance?deviceId=${device.id}`);
            if (r.ok) {
              const linked = await r.json();
              linked.forEach((m) => {
                if (!devMainMap[m.id]) devMainMap[m.id] = [];
                devMainMap[m.id].push(device.id);
              });
            }
          } catch (_) { /* skip */ }
        }),
      );
      setDeviceMaintenanceMap(devMainMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── derived cards ──────────────────────────────────────────────────────────
  const deviceMap = useMemo(() => {
    const map = {};
    devices.forEach((d) => { map[d.id] = d; });
    return map;
  }, [devices]);

  /**
   * Build a "card" object for each maintenance × linked-device combo.
   * If no device is linked we still show the maintenance with "—" vehicle.
   */
  const cards = useMemo(() => {
    return maintenances.flatMap((m) => {
      const linkedDeviceIds = deviceMaintenanceMap[m.id] || [];

      // If no device linked, show one card with no device context
      const deviceEntries = linkedDeviceIds.length > 0
        ? linkedDeviceIds.map((did) => ({ deviceId: did, device: deviceMap[did] }))
        : [{ deviceId: null, device: null }];

      return deviceEntries.map(({ deviceId, device }) => {
        const position = deviceId ? positions[deviceId] : null;
        const currValue = currentValueForType(m.type, position);
        const { progress, remaining, endValue, expired } = computeProgress(
          m.type, m.start, m.period, currValue,
        );
        const status = statusFromProgress(progress, expired);
        const typeLabel = TYPE_LABELS[m.type] || m.type;
        const price = m.attributes?.cost;
        const vehicleName = device
          ? (device.name || device.uniqueId || `#${device.id}`)
          : '—';

        return {
          _id: `${m.id}-${deviceId ?? 'none'}`,
          _maintenanceId: m.id,
          _deviceId: deviceId,
          _startDisplay: formatStart(m.type, m.start),
          _periodDisplay: formatPeriod(m.type, m.period),
          id: m.id,
          name: m.name,
          type: m.type,
          typeLabel,
          start: m.start,
          period: m.period,
          vehicleName,
          price,
          debut: formatStart(m.type, m.start),
          fin: endValue || '—',
          remaining,
          progress,
          status,
          expired,
          attributes: m.attributes,
        };
      });
    });
  }, [maintenances, deviceMaintenanceMap, deviceMap, positions]);

  // ── filter + search ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = cards;
    if (activeFilter === FILTER_EXPIRED) result = result.filter((c) => c.expired);
    if (activeFilter === FILTER_URGENT) result = result.filter((c) => !c.expired && c.progress >= 75);
    if (activeFilter === FILTER_UPCOMING) result = result.filter((c) => !c.expired && c.progress < 75);
    if (searchValue.trim()) {
      const kw = searchValue.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(kw) ||
          c.vehicleName.toLowerCase().includes(kw) ||
          c.typeLabel.toLowerCase().includes(kw),
      );
    }
    return result;
  }, [cards, activeFilter, searchValue]);

  // ── summary counts ─────────────────────────────────────────────────────────
  const countExpired = cards.filter((c) => c.expired).length;
  const countUrgent = cards.filter((c) => !c.expired && c.progress >= 75).length;
  const countOk = cards.filter((c) => !c.expired && c.progress < 75).length;

  // ── CRUD ───────────────────────────────────────────────────────────────────
  const handleSave = async (payload, deviceId, existingId) => {
    try {
      let savedId = existingId;

      if (existingId) {
        // Update
        const r = await fetch(`/api/maintenance/${existingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: existingId, ...payload }),
        });
        if (!r.ok) throw new Error('Erreur lors de la mise à jour');
      } else {
        // Create
        const r = await fetch('/api/maintenance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!r.ok) throw new Error('Erreur lors de la création');
        const created = await r.json();
        savedId = created.id;

        // Link to device if selected
        if (deviceId && savedId) {
          await fetch('/api/permissions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deviceId: parseInt(deviceId, 10), maintenanceId: savedId }),
          });
        }
      }

      setSnack({ open: true, msg: existingId ? 'Maintenance mise à jour' : 'Maintenance créée', severity: 'success' });
      fetchAll();
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const r = await fetch(`/api/maintenance/${deleteTarget.id}`, { method: 'DELETE' });
      if (!r.ok) throw new Error('Erreur lors de la suppression');
      setSnack({ open: true, msg: 'Maintenance supprimée', severity: 'success' });
      setDeleteTarget(null);
      fetchAll();
    } catch (err) {
      setSnack({ open: true, msg: err.message, severity: 'error' });
    }
  };

  // ── colour helpers ─────────────────────────────────────────────────────────
  const statusColors = (status) => ({
    red: { bg: classes.bgRed, bar: '#ff4d4f', text: '#ff4d4f', chipBg: '#fff1f0' },
    orange: { bg: classes.bgOrange, bar: '#faad14', text: '#faad14', chipBg: '#fffbe6' },
    green: { bg: classes.bgGreen, bar: '#52c41a', text: '#52c41a', chipBg: '#f6ffed' },
    teal: { bg: classes.bgTeal, bar: '#13c2c2', text: '#13c2c2', chipBg: '#e6fffb' },
  }[status] || { bg: classes.bgTeal, bar: '#13c2c2', text: '#13c2c2', chipBg: '#e6fffb' });

  const typeIcon = (type) => {
    if (type?.endsWith('Time') || type === 'deviceTime' || type === 'fixTime')
      return <TimerOutlined sx={{ fontSize: 18 }} />;
    if (type === 'hours' || type === 'drivingTime')
      return <BuildOutlined sx={{ fontSize: 18 }} />;
    return <Construction sx={{ fontSize: 18 }} />;
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <PageLayout>
      <Box className={classes.root}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <Box className={classes.headerRow}>
          <Box>
            <Typography className={classes.pageTitle}>
              Maintenances
            </Typography>
            <Typography className={classes.pageSubtitle}>
              Gérer les maintenances et planifications de véhicules
            </Typography>
          </Box>
          <Tooltip title="Actualiser">
            <IconButton
              onClick={fetchAll}
              disabled={loading}
              sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0' }}
            >
              <Refresh sx={{ color: loading ? '#cbd5e1' : '#10b981' }} />
            </IconButton>
          </Tooltip>
        </Box>

        {/* ── Summary badges ──────────────────────────────────────────────── */}
        {!loading && (
          <Stack direction="row" spacing={2} sx={{ mb: 3, flexWrap: 'wrap' }}>
            <Box className={classes.summaryBadge}>
              <WarningAmberOutlined sx={{ color: '#ef4444', fontSize: 18 }} />
              <span style={{ color: '#ef4444' }}>{countExpired}</span>
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>Expirées</span>
            </Box>
            <Box className={classes.summaryBadge}>
              <WarningAmberOutlined sx={{ color: '#f59e0b', fontSize: 18 }} />
              <span style={{ color: '#f59e0b' }}>{countUrgent}</span>
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>Urgentes (&gt;75%)</span>
            </Box>
            <Box className={classes.summaryBadge}>
              <CheckCircleOutlineOutlined sx={{ color: '#10b981', fontSize: 18 }} />
              <span style={{ color: '#10b981' }}>{countOk}</span>
              <span style={{ color: '#94a3b8', fontWeight: 400 }}>En cours</span>
            </Box>
          </Stack>
        )}

        {/* ── Error banner ────────────────────────────────────────────────── */}
        {error && (
          <Box sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography sx={{ color: '#dc2626', fontSize: '0.85rem', fontWeight: 600 }}>⚠ {error}</Typography>
          </Box>
        )}

        {/* ── Search + filters + create ────────────────────────────────────── */}
        <Box className={classes.searchAndFilterRow}>
          <Stack direction="row" spacing={1} alignItems="center">
            <TextField
              placeholder="Rechercher par nom, véhicule ou type..."
              className={classes.searchField}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#cbd5e1' }} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Filter buttons */}
            {[
              { key: FILTER_ALL, Icon: Layers, title: 'Tout', color: '#64748b' },
              { key: FILTER_EXPIRED, Icon: MedicalServicesOutlined, title: 'Expirées', color: '#ef4444' },
              { key: FILTER_URGENT, Icon: Waves, title: 'Urgentes', color: '#f59e0b' },
              { key: FILTER_UPCOMING, Icon: BuildOutlined, title: 'En cours', color: '#10b981' },
            ].map(({ key, Icon, title, color }) => (
              <Tooltip key={key} title={title}>
                <IconButton
                  onClick={() => setActiveFilter(key)}
                  className={activeFilter === key
                    ? `${classes.filterIcon} ${classes.filterIconActive}`
                    : classes.filterIcon}
                >
                  <Icon sx={{ fontSize: 18, color: activeFilter === key ? '#fff' : color }} />
                </IconButton>
              </Tooltip>
            ))}
          </Stack>

          <Button
            startIcon={<Add />}
            className={classes.createButton}
            onClick={() => { setEditItem(null); setDialogOpen(true); }}
          >
            Créer une maintenance
          </Button>
        </Box>

        {/* ── Cards grid ──────────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2.5 }}>
          {loading ? (
            [...Array(8)].map((_, i) => <CardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <Box sx={{ width: '100%', textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: '#94a3b8', fontSize: '0.95rem' }}>
                Aucune maintenance trouvée
              </Typography>
            </Box>
          ) : (
            filtered.map((item) => {
              const colors = statusColors(item.status);
              const isExpired = item.remaining === '0 jours' || item.remaining === '0 km' || item.remaining === '0 h';

              return (
                <Box key={item._id} sx={{ width: 'calc(25% - 15px)', minWidth: 220, flexShrink: 0 }}>
                  <Paper elevation={0} className={`${classes.maintenanceCard} ${colors.bg}`}>

                    {/* Card header */}
                    <Box className={classes.cardHeader}>
                      <Typography className={classes.cardTitle}>
                        {typeIcon(item.type)}
                        {item.name}
                      </Typography>
                      <Chip
                        label={item.price != null ? `${parseFloat(item.price).toFixed(2)} Dh` : item.typeLabel}
                        className={classes.priceChip}
                        sx={{ color: colors.text, backgroundColor: colors.chipBg, fontSize: '0.72rem' }}
                      />
                    </Box>

                    {/* Vehicle */}
                    <Typography className={classes.vehicleInfo}>
                      {item.vehicleName}
                    </Typography>

                    {/* Details grid */}
                    <Box className={classes.detailsGrid}>
                      <span className={classes.label}>
                        début:{' '}
                        <span className={classes.value}>{item.debut}</span>
                      </span>
                      <span className={classes.label}>
                        fin:{' '}
                        <span className={classes.value}>{item.fin}</span>
                      </span>
                      <span className={classes.label}>
                        restants:{' '}
                        <span
                          className={classes.value}
                          style={{ fontWeight: 800, color: isExpired ? '#ff4d4f' : colors.text }}
                        >
                          {item.remaining}
                        </span>
                      </span>
                      <span className={classes.label}>
                        période:{' '}
                        <span className={classes.value}>{item._periodDisplay}</span>
                      </span>
                    </Box>

                    {/* Progress bar */}
                    <Box className={classes.progressSection}>
                      <Box className={classes.progressHeader}>
                        <span>Progrès</span>
                        <span style={{ color: '#1e293b' }}>{item.progress}%</span>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={item.progress}
                        className={classes.progressBar}
                        sx={{
                          backgroundColor: '#e2e8f0',
                          '& .MuiLinearProgress-bar': { backgroundColor: colors.bar },
                        }}
                      />
                    </Box>

                    {/* Actions */}
                    <Box className={classes.cardActions}>
                      <Button
                        startIcon={<Edit sx={{ fontSize: 16 }} />}
                        onClick={() => { setEditItem(item); setDialogOpen(true); }}
                      >
                        Modifier
                      </Button>
                      <Button
                        startIcon={<Delete sx={{ fontSize: 16 }} />}
                        onClick={() => setDeleteTarget(item)}
                        sx={{ color: '#ef4444 !important' }}
                      >
                        Supprimer
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              );
            })
          )}
        </Box>
      </Box>

      {/* ── Create / Edit Dialog ─────────────────────────────────────────── */}
      <MaintenanceDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        devices={devices}
        editItem={editItem}
      />

      {/* ── Delete Confirm Dialog ─────────────────────────────────────────── */}
      <DeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        name={deleteTarget?.name}
      />

      {/* ── Snackbar ─────────────────────────────────────────────────────── */}
      <Snackbar
        open={snack.open}
        autoHideDuration={3500}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack.severity} sx={{ borderRadius: 2 }} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </PageLayout>
  );
};

export default MaintenanceDashboard;